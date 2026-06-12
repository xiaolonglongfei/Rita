import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getAdminUser() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  const db = createServiceClient();
  const { data: profile } = await db.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return null;
  return user;
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("reviews")
    .select("*, instructors(full_name), users(full_name, avatar_url)")
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { reviewId, status, moderationNote } = await request.json();
  const db = createServiceClient();

  await db
    .from("reviews")
    .update({ moderation_status: status, moderation_note: moderationNote ?? null })
    .eq("id", reviewId);

  const { data: review } = await db.from("reviews").select("*").eq("id", reviewId).single();

  if (review) {
    const { data: approvedReviews } = await db
      .from("reviews")
      .select("rating_value, rating_effectiveness, rating_punctuality")
      .eq("instructor_id", review.instructor_id)
      .eq("moderation_status", "approved");

    const rows = approvedReviews ?? [];
    if (rows.length === 0) {
      await db
        .from("instructors")
        .update({ avg_overall: 0, avg_value: 0, avg_effectiveness: 0, avg_punctuality: 0, total_reviews: 0 })
        .eq("id", review.instructor_id);
    } else {
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const overallScores = rows.map(
        (r) => (r.rating_value + r.rating_effectiveness + r.rating_punctuality) / 3
      );
      await db
        .from("instructors")
        .update({
          total_reviews: rows.length,
          avg_value: avg(rows.map((r) => r.rating_value)),
          avg_effectiveness: avg(rows.map((r) => r.rating_effectiveness)),
          avg_punctuality: avg(rows.map((r) => r.rating_punctuality)),
          avg_overall: avg(overallScores),
        })
        .eq("id", review.instructor_id);
    }

    await db.from("notifications").insert({
      user_id: review.student_id,
      type: status === "approved" ? "review_approved" : "review_rejected",
      message:
        status === "approved"
          ? "Your review has been approved and is now visible."
          : `Your review was not approved${moderationNote ? `: ${moderationNote}` : "."}`,
    });
  }

  return NextResponse.json({ ok: true });
}
