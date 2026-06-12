import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("sessions")
    .select("*, instructors(full_name)")
    .eq("student_id", user.id)
    .order("session_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((s) => ({
      id: s.id,
      instructorId: s.instructor_id,
      instructorName: (s.instructors as { full_name: string } | null)?.full_name ?? null,
      sessionDate: s.session_date,
      location: s.location,
      status: s.status,
      verified: !!s.verified_at,
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
      student_id: user.id,
      instructor_id: body.instructorId,
      session_date: body.sessionDate,
      location: body.location ?? null,
      status: "pending",
      initiated_by: "student",
    })
    .select("*, instructors(full_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
