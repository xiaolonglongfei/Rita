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
    .select("*, instructors(name), users(name, avatar_url)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { reviewId, status, moderationNote } = await request.json();
  const db = createServiceClient();

  await db.from("reviews").update({ status, moderation_note: moderationNote ?? null }).eq("id", reviewId);

  const { data: review } = await db.from("reviews").select("*").eq("id", reviewId).single();

  if (review) {
    const { data: reviews } = await db
      .from("reviews")
      .select("value, effectiveness, punctuality, overall_score")
      .eq("instructor_id", review.instructor_id)
      .eq("status", "approved");

    const rows = reviews ?? [];
    if (rows.length === 0) {
      await db.from("instructors").update({
        avg_score: 0, avg_value: 0, avg_effectiveness: 0, avg_punctuality: 0, review_count: 0,
      }).eq("id", review.instructor_id);
    } else {
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      await db.from("instructors").update({
        review_count: rows.length,
        avg_value: avg(rows.map((r) => r.value)),
        avg_effectiveness: avg(rows.map((r) => r.effectiveness)),
        avg_punctuality: avg(rows.map((r) => r.punctuality)),
        avg_score: avg(rows.map((r) => r.overall_score)),
      }).eq("id", review.instructor_id);
    }

    await db.from("notifications").insert({
      user_id: review.user_id,
      type: status === "approved" ? "review_approved" : "review_rejected",
      message: status === "approved"
        ? "Your review has been approved and is now visible."
        : `Your review was not approved${moderationNote ? `: ${moderationNote}` : "."}`,
    });
  }

  return NextResponse.json({ ok: true });
}
