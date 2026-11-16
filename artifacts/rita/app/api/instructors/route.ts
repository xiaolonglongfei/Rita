import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { instructorNameKey, studentInstructorValidation, withInstructorCreationLock } from "@/lib/instructor-creation";
import { checkReviewContentLayer1 } from "@/lib/moderation/layer1";
import { parseBioSource } from "@/lib/instructor-bio-source";
import { bioSourcePermissionsReady } from "@/lib/bio-source-access";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const location = searchParams.get("location");
  const minScore = searchParams.get("minScore");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase
    .from("instructors")
    .select("id, full_name, bio, avatar_url, teaching_locations, is_claimed, reviews_visible, avg_overall, avg_value, avg_effectiveness, avg_punctuality, total_reviews, created_at", { count: "exact" })
    .is("opted_out_at", null)
    .eq("is_test", false)   // never expose QA/test records to real users
    .eq("is_active", true); // hide former/inactive instructors from public browse

  if (search) query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`);
  if (location) query = query.ilike("teaching_locations", `%${location}%`);
  if (minScore) query = query.gte("avg_overall", parseFloat(minScore));

  const { data, error, count } = await query
    .order("full_name", { ascending: true }) // stable alphabetical order; was avg_overall DESC
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: (data ?? []).map((i) => {
      // Privacy: only expose scores when reviews_visible = true (requires 3+ approved reviews)
      const scoresVisible = i.reviews_visible === true;
      return {
        id: i.id,
        name: i.full_name,
        bio: i.bio,
        photoUrl: i.avatar_url,
        location: i.teaching_locations,
        claimed: i.is_claimed,
        reviewsVisible: scoresVisible,
        avgScore: scoresVisible ? i.avg_overall : null,
        avgValue: scoresVisible ? i.avg_value : null,
        avgEffectiveness: scoresVisible ? i.avg_effectiveness : null,
        avgPunctuality: scoresVisible ? i.avg_punctuality : null,
        reviewCount: i.total_reviews,
        createdAt: i.created_at,
      };
    }),
    total: count ?? 0,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Please check the instructor details and try again." }, { status: 400 });
  }
  const db = createServiceClient();
  const { data: userData, error: roleError } = await db
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (roleError) return NextResponse.json({ error: "Unable to check your account. Please try again." }, { status: 500 });
  const isAdmin = userData?.is_admin === true;
  const sourceFields = ["bio_source_url", "bio_source_checked_at", "bioSourceUrl", "bioSourceCheckedAt"];
  if (!isAdmin && sourceFields.some((key) => Object.prototype.hasOwnProperty.call(body, key))) {
    return NextResponse.json({ error: "Bio source details can only be set by an administrator." }, { status: 400 });
  }
  const source = isAdmin ? parseBioSource(body) : { values: {} };
  if ("error" in source) return NextResponse.json({ error: source.error }, { status: 400 });
  if (Object.values(source.values).some((value) => value !== null) && !(await bioSourcePermissionsReady())) {
    return NextResponse.json({ error: "Bio source privacy permissions are not configured yet. Apply the supplied database privacy SQL before saving source details." }, { status: 503 });
  }
  if (!isAdmin && body.confirmed_student !== true) {
    return NextResponse.json({ error: "Please confirm that you've taken lessons with this coach." }, { status: 400 });
  }
  const name = body.full_name ?? body.name;
  const location = body.teaching_locations ?? body.location ?? null;
  const validation = isAdmin
    ? (typeof name !== "string" || !name.trim() ? "Name is required" : null)
    : studentInstructorValidation(name, location);
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });
  const full_name = (name as string).trim();

  return withInstructorCreationLock(user.id, async () => {
    // Sort before limiting: any opted-out match must take precedence over all
    // other matches, including an active row with the same generated key.
    const { data: existing, error: lookupError } = await db.from("instructors")
      .select("id, full_name, is_active, opted_out_at")
      .eq("name_key", instructorNameKey(full_name))
      .order("opted_out_at", { ascending: false, nullsFirst: false })
      .order("is_active", { ascending: false, nullsFirst: false })
      .limit(1).maybeSingle();
    if (lookupError) return NextResponse.json({ error: "Unable to check for an existing instructor. Please try again." }, { status: 500 });
    if (existing?.opted_out_at) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing) {
      return NextResponse.json({ error: existing.is_active === true
        ? `An instructor named "${existing.full_name}" already exists. Please search for them instead.`
        : "This coach can’t be added right now." }, { status: 409 });
    }

    if (!isAdmin) {
      const { count, error: countError } = await db.from("instructors")
        .select("id", { count: "exact", head: true }).eq("created_by", user.id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      if (countError || count == null) return NextResponse.json({ error: "Unable to check your adding limit. Please try again." }, { status: 500 });
      if (count >= 3) {
        return NextResponse.json({ error: "You can add up to 3 instructors in 24 hours. Please try again later." }, { status: 429 });
      }
      const results = [full_name, typeof location === "string" ? location.trim() : ""]
        .map(checkReviewContentLayer1);
      const blockers = [...new Set(results.flatMap((result) => result.blockers))];
      const warnings = [...new Set(results.flatMap((result) => result.warnings))];
      if (blockers.length || warnings.length) {
        const { error: logError } = await db.from("content_filter_logs").insert({
          instructor_id: null, attempted_by: user.id,
          blocked_categories: blockers, warned_categories: warnings,
          flagged_content: `Name: ${full_name}\nLocation: ${location ?? ""}`,
        });
        if (logError) return NextResponse.json({ error: "Unable to check these details. Please try again." }, { status: 500 });
        return NextResponse.json({ error: "Please revise the instructor name or teaching location to meet our content guidelines." }, { status: 400 });
      }
    }

    const { data, error } = await db.from("instructors").insert({
      full_name,
      bio: isAdmin ? body.bio ?? null : null,
      teaching_locations: typeof location === "string" ? location.trim() || null : location,
      avatar_url: isAdmin ? body.photoUrl ?? null : null,
      internal_notes: isAdmin ? body.internalNotes ?? null : null,
      ...source.values,
      created_by: user.id,
      created_by_source: isAdmin ? body.created_by_source ?? "admin" : "student",
      is_active: isAdmin,
    }).select("id, full_name, bio, avatar_url, teaching_locations, is_active, created_by_source").single();
    if (error) return NextResponse.json({ error: "Unable to add this instructor. Please try again." }, { status: 500 });
    return NextResponse.json({ instructor: data }, { status: 201 });
  });
}
