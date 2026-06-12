import { createClient } from "@/lib/supabase/server";
import { query, queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query(
    `SELECT s.*, i.name as instructor_name
     FROM sessions s
     LEFT JOIN instructors i ON i.id = s.instructor_id
     WHERE s.user_id = $1
     ORDER BY s.session_date DESC`,
    [user.id]
  );

  return NextResponse.json(
    rows.map((s) => ({
      id: s.id,
      instructorId: s.instructor_id,
      instructorName: s.instructor_name ?? null,
      sessionDate: s.session_date,
      verified: s.verified,
      notes: s.notes,
      createdAt: s.created_at,
    }))
  );
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const session = await queryOne(
    `INSERT INTO sessions (user_id, instructor_id, session_date, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [user.id, body.instructorId, body.sessionDate, body.notes ?? null]
  );

  return NextResponse.json(session, { status: 201 });
}
