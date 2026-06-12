import { createClient } from "@/lib/supabase/server";
import { query, queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query(
    `SELECT r.*, i.name as instructor_name
     FROM reviews r
     LEFT JOIN instructors i ON i.id = r.instructor_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [user.id]
  );

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      instructorId: r.instructor_id,
      instructorName: r.instructor_name ?? null,
      value: r.value,
      effectiveness: r.effectiveness,
      punctuality: r.punctuality,
      overallScore: r.overall_score,
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at,
    }))
  );
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { instructorId, sessionId, value, effectiveness, punctuality, comment } = body;
  const overallScore = (value + effectiveness + punctuality) / 3;

  const review = await queryOne(
    `INSERT INTO reviews (user_id, instructor_id, session_id, value, effectiveness, punctuality, overall_score, comment, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
    [user.id, instructorId, sessionId ?? null, value, effectiveness, punctuality, overallScore, comment ?? null]
  );

  const instructor = await queryOne<{ name: string }>(
    "SELECT name FROM instructors WHERE id = $1",
    [instructorId]
  );

  await query(
    `INSERT INTO notifications (user_id, type, message)
     VALUES ($1, 'review_submitted', $2)`,
    [user.id, `Your review for ${instructor?.name ?? "instructor"} has been submitted and is awaiting moderation.`]
  );

  return NextResponse.json(review, { status: 201 });
}
