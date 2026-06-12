import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("reviews")
    .select("*, instructors(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((r) => ({
      id: r.id,
      instructorId: r.instructor_id,
      instructorName: (r.instructors as { name: string } | null)?.name ?? null,
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

  const db = createServiceClient();
  const body = await request.json();
  const { instructorId, sessionId, value, effectiveness, punctuality, comment } = body;
  const overallScore = (value + effectiveness + punctuality) / 3;

  const { data: review, error } = await db
    .from("reviews")
    .insert({
      user_id: user.id,
      instructor_id: instructorId,
      session_id: sessionId ?? null,
      value,
      effectiveness,
      punctuality,
      overall_score: overallScore,
      comment: comment ?? null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: instructor } = await db.from("instructors").select("name").eq("id", instructorId).single();

  await db.from("notifications").insert({
    user_id: user.id,
    type: "review_submitted",
    message: `Your review for ${(instructor as { name: string } | null)?.name ?? "instructor"} has been submitted and is awaiting moderation.`,
  });

  return NextResponse.json(review, { status: 201 });
}
