import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
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

  const conditions: string[] = [];
  const params: unknown[] = [];
  let p = 1;

  if (search) {
    conditions.push(`(name ILIKE $${p} OR bio ILIKE $${p})`);
    params.push(`%${search}%`);
    p++;
  }
  if (specialty) {
    conditions.push(`specialty ILIKE $${p}`);
    params.push(`%${specialty}%`);
    p++;
  }
  if (location) {
    conditions.push(`location ILIKE $${p}`);
    params.push(`%${location}%`);
    p++;
  }
  if (minScore) {
    conditions.push(`avg_score >= $${p}`);
    params.push(parseFloat(minScore));
    p++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [countRows, rows] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*) as count FROM instructors ${where}`, params),
    query(
      `SELECT * FROM instructors ${where} ORDER BY avg_score DESC NULLS LAST LIMIT $${p} OFFSET $${p + 1}`,
      [...params, limit, offset]
    ),
  ]);

  const total = parseInt(countRows[0]?.count ?? "0");

  return NextResponse.json({
    items: rows.map((i) => ({
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
    total,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await query<{ is_admin: boolean }>(
    "SELECT is_admin FROM users WHERE id = $1",
    [user.id]
  );
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const [instructor] = await query(
    `INSERT INTO instructors (name, specialty, bio, photo_url, location)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [body.name, body.specialty ?? "Tennis", body.bio ?? null, body.photoUrl ?? null, body.location ?? null]
  );

  return NextResponse.json(instructor, { status: 201 });
}
