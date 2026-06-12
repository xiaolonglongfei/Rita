import { createClient } from "@/lib/supabase/server";
import { query, queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

async function getAdminUser() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  const profile = await queryOne<{ is_admin: boolean }>(
    "SELECT is_admin FROM users WHERE id = $1",
    [user.id]
  );
  if (!profile?.is_admin) return null;
  return user;
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await query(
    `SELECT r.*, i.name as instructor_name, u.name as user_name, u.avatar_url as user_avatar
     FROM reviews r
     LEFT JOIN instructors i ON i.id = r.instructor_id
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.status = 'pending'
     ORDER BY r.created_at ASC`
  );

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { reviewId, status, moderationNote } = await request.json();

  await query(
    `UPDATE reviews SET status = $1, moderation_note = $2 WHERE id = $3`,
    [status, moderationNote ?? null, reviewId]
  );

  const review = await queryOne<{
    instructor_id: number;
    user_id: string;
  }>(
    "SELECT * FROM reviews WHERE id = $1",
    [reviewId]
  );

  if (review) {
    const approvedReviews = await query<{
      value: number;
      effectiveness: number;
      punctuality: number;
      overall_score: number;
    }>(
      `SELECT value, effectiveness, punctuality, overall_score
       FROM reviews WHERE instructor_id = $1 AND status = 'approved'`,
      [review.instructor_id]
    );

    if (approvedReviews.length === 0) {
      await query(
        `UPDATE instructors SET avg_score = 0, avg_value = 0, avg_effectiveness = 0, avg_punctuality = 0, review_count = 0
         WHERE id = $1`,
        [review.instructor_id]
      );
    } else {
      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      await query(
        `UPDATE instructors SET
          review_count = $1, avg_value = $2, avg_effectiveness = $3, avg_punctuality = $4, avg_score = $5
         WHERE id = $6`,
        [
          approvedReviews.length,
          avg(approvedReviews.map((r) => r.value)),
          avg(approvedReviews.map((r) => r.effectiveness)),
          avg(approvedReviews.map((r) => r.punctuality)),
          avg(approvedReviews.map((r) => r.overall_score)),
          review.instructor_id,
        ]
      );
    }

    await query(
      `INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)`,
      [
        review.user_id,
        status === "approved" ? "review_approved" : "review_rejected",
        status === "approved"
          ? "Your review has been approved and is now visible."
          : `Your review was not approved${moderationNote ? `: ${moderationNote}` : "."}`,
      ]
    );
  }

  return NextResponse.json({ ok: true });
}
