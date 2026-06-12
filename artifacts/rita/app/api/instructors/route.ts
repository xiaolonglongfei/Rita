import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const specialty = searchParams.get("specialty");
  const location = searchParams.get("location");
  const minScore = searchParams.get("minScore");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase.from("instructors").select("*", { count: "exact" });

  if (search) query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%`);
  if (specialty) query = query.ilike("specialty", `%${specialty}%`);
  if (location) query = query.ilike("location", `%${location}%`);
  if (minScore) query = query.gte("avg_score", parseFloat(minScore));

  const { data, error, count } = await query
    .order("avg_score", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: (data ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      bio: i.bio,
      specialty: i.specialty,
      photoUrl: i.photo_url,
      location: i.location,
      verified: i.verified,
      avgScore: i.avg_score,
      avgValue: i.avg_value,
      avgEffectiveness: i.avg_effectiveness,
      avgPunctuality: i.avg_punctuality,
      reviewCount: i.review_count,
      publicRank: i.public_rank,
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
      name: body.name,
      specialty: body.specialty ?? "Tennis",
      bio: body.bio ?? null,
      photo_url: body.photoUrl ?? null,
      location: body.location ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
