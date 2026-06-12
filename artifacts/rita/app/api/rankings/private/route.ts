import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [myReviews, allInstructors] = await Promise.all([
    query<{ instructor_id: number; overall_score: number }>(
      `SELECT instructor_id, overall_score FROM reviews
       WHERE user_id = $1 AND status = 'approved'`,
      [user.id]
    ),
    query(
      `SELECT id, name, photo_url, specialty, avg_score, review_count, verified
       FROM instructors WHERE review_count > 0`
    ),
  ]);

  if (!myReviews.length) {
    return NextResponse.json(
      [...allInstructors]
        .sort((a, b) => b.avg_score - a.avg_score)
        .slice(0, 50)
        .map((i, idx) => ({
          rank: idx + 1,
          instructorId: i.id,
          instructorName: i.name,
          instructorPhotoUrl: i.photo_url,
          specialty: i.specialty,
          avgScore: i.avg_score,
          reviewCount: i.review_count,
          verified: i.verified,
        }))
    );
  }

  const reviewedIds = [...new Set(myReviews.map((r) => r.instructor_id))];
  const scored = allInstructors.map((i) => {
    const mine = myReviews.filter((r) => r.instructor_id === i.id);
    const myScore = mine.length ? mine.reduce((s, r) => s + r.overall_score, 0) / mine.length : 0;
    const hasMyReview = reviewedIds.includes(i.id);
    const blendedScore = hasMyReview ? myScore * 0.7 + i.avg_score * 0.3 : i.avg_score * 0.5;
    return { i, blendedScore, hasMyReview };
  });

  scored.sort((a, b) => {
    if (a.hasMyReview && !b.hasMyReview) return -1;
    if (!a.hasMyReview && b.hasMyReview) return 1;
    return b.blendedScore - a.blendedScore;
  });

  return NextResponse.json(
    scored.slice(0, 50).map(({ i }, idx) => ({
      rank: idx + 1,
      instructorId: i.id,
      instructorName: i.name,
      instructorPhotoUrl: i.photo_url,
      specialty: i.specialty,
      avgScore: i.avg_score,
      reviewCount: i.review_count,
      verified: i.verified,
    }))
  );
}
