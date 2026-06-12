import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("reviews")
    .select("*, instructors(full_name)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((r) => {
      const overallScore = (r.rating_value + r.rating_effectiveness + r.rating_punctuality) / 3;
      return {
        id: r.id,
        instructorId: r.instructor_id,
        instructorName: (r.instructors as { full_name: string } | null)?.full_name ?? null,
        value: r.rating_value,
        effectiveness: r.rating_effectiveness,
        punctuality: r.rating_punctuality,
        overallScore,
        comment: r.comment,
        status: r.moderation_status,
        createdAt: r.created_at,
      };
    })
  );
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const body = await request.json();
  const { instructorId, sessionId, value, effectiveness, punctuality, comment } = body;

  const { data: review, error } = await db
    .from("reviews")
    .insert({
      student_id: user.id,
      instructor_id: instructorId,
      session_id: sessionId ?? null,
      rating_value: value,
      rating_effectiveness: effectiveness,
      rating_punctuality: punctuality,
      comment: comment ?? null,
      moderation_status: "pending",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: instructor } = await db
    .from("instructors")
    .select("full_name")
    .eq("id", instructorId)
    .single();

  await db.from("notifications").insert({
    user_id: user.id,
    type: "review_submitted",
    message: `Your review for ${(instructor as { full_name: string } | null)?.full_name ?? "instructor"} has been submitted and is awaiting moderation.`,
  });

  return NextResponse.json(review, { status: 201 });
}
