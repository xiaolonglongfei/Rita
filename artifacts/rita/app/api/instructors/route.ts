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
    items: (data ?? []).map((i) => ({
      id: i.id,
      name: i.full_name,
      bio: i.bio,
      photoUrl: i.avatar_url,
      location: i.teaching_locations,
      claimed: i.is_claimed,
      avgScore: i.avg_overall,
      avgValue: i.avg_value,
      avgEffectiveness: i.avg_effectiveness,
      avgPunctuality: i.avg_punctuality,
      reviewCount: i.total_reviews,
      createdAt: i.created_at,
    })),
    total: count ?? 0,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data: profile } = await db.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { data, error } = await db
    .from("instructors")
    .insert({
      full_name: body.name,
      bio: body.bio ?? null,
      avatar_url: body.photoUrl ?? null,
      teaching_locations: body.location ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
