import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("sessions")
    .select("*, instructors(name)")
    .eq("user_id", user.id)
    .order("session_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((s) => ({
      id: s.id,
      instructorId: s.instructor_id,
      instructorName: (s.instructors as { name: string } | null)?.name ?? null,
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

  const db = createServiceClient();
  const body = await request.json();
  const { data, error } = await db
    .from("sessions")
    .insert({
      user_id: user.id,
      instructor_id: body.instructorId,
      session_date: body.sessionDate,
      notes: body.notes ?? null,
    })
    .select("*, instructors(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
