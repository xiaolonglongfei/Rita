import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
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
      const overallScore =
        (r.rating_value + r.rating_effectiveness + r.rating_punctuality) / 3;
      return {
        id: r.id,
        instructorId: r.instructor_id,
        instructorName:
          (r.instructors as { full_name: string } | null)?.full_name ?? null,
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
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    instructor_id,
    rating_value,
    rating_effectiveness,
    rating_punctuality,
    comment,
  } = body;

  if (
    !instructor_id ||
    rating_value == null ||
    rating_effectiveness == null ||
    rating_punctuality == null
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const scores = [rating_value, rating_effectiveness, rating_punctuality];
  if (scores.some((s: number) => s < 0 || s > 5)) {
    return NextResponse.json(
      { error: "Scores must be between 0 and 5" },
      { status: 400 }
    );
  }

  const db = createServiceClient();

  await db.from("users").upsert({
    id: user.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name || user.email!,
  }, { onConflict: "id" });

  const { data: review, error } = await db
    .from("reviews")
    .insert({
      student_id: user.id,
      instructor_id,
      rating_value,
      rating_effectiveness,
      rating_punctuality,
      comment: comment || null,
      moderation_status: "approved",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send notification to the reviewer
  const { data: instructor } = await db
    .from("instructors")
    .select("full_name")
    .eq("id", instructor_id)
    .single();

  await db.from("notifications").insert({
    user_id: user.id,
    type: "review_submitted",
    message: `Your review for ${
      (instructor as { full_name: string } | null)?.full_name ?? "the instructor"
    } has been submitted.`,
  });

  return NextResponse.json({ review }, { status: 201 });
}
