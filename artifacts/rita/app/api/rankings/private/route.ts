import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const [{ data: myReviews }, { data: allInstructors }] = await Promise.all([
    db.from("reviews").select("instructor_id, overall_score").eq("user_id", user.id).eq("status", "approved"),
    db.from("instructors").select("id, name, photo_url, specialty, avg_score, review_count, verified").gt("review_count", 0),
  ]);

  const reviews = myReviews ?? [];
  const instructors = allInstructors ?? [];

  if (!reviews.length) {
    return NextResponse.json(
      [...instructors].sort((a, b) => b.avg_score - a.avg_score).slice(0, 50).map((i, idx) => ({
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

  const reviewedIds = [...new Set(reviews.map((r) => r.instructor_id))];
  const scored = instructors.map((i) => {
    const mine = reviews.filter((r) => r.instructor_id === i.id);
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
