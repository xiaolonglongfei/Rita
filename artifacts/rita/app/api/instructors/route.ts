import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const location = searchParams.get("location");
  const minScore = searchParams.get("minScore");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase.from("instructors").select("*", { count: "exact" });

  if (search) query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`);
  if (location) query = query.ilike("teaching_locations", `%${location}%`);
  if (minScore) query = query.gte("avg_overall", parseFloat(minScore));

  const { data, error, count } = await query
    .order("avg_overall", { ascending: false })
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

  const body = await request.json();
  const full_name = (body.full_name ?? body.name ?? "").trim();

  if (!full_name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Duplicate check (case-insensitive)
  const { data: existing } = await supabase
    .from("instructors")
    .select("id, full_name")
    .ilike("full_name", full_name)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      {
        error: `An instructor named "${existing[0].full_name}" already exists. Please search for them instead.`,
      },
      { status: 409 }
    );
  }

  // Determine source: admin vs student
  const { data: userData } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const source = userData?.is_admin
    ? (body.created_by_source ?? "admin")
    : "student";

  const db = createServiceClient();
  const { data, error } = await db
    .from("instructors")
    .insert({
      full_name,
      bio: body.bio ?? null,
      teaching_locations: body.teaching_locations ?? body.location ?? null,
      avatar_url: body.photoUrl ?? null,
      created_by: user.id,
      created_by_source: source,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ instructor: data }, { status: 201 });
}
