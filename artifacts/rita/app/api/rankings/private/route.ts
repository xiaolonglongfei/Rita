import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const [{ data: myReviews }, { data: allInstructors }] = await Promise.all([
    db
      .from("reviews")
      .select("instructor_id, rating_value, rating_effectiveness, rating_punctuality")
      .eq("student_id", user.id)
      .eq("moderation_status", "approved"),
    db
      .from("instructors")
      .select("id, full_name, avatar_url, teaching_locations, avg_overall, total_reviews, is_claimed")
      .gt("total_reviews", 0),
  ]);

  const reviews = (myReviews ?? []).map((r) => ({
    instructor_id: r.instructor_id,
    overall_score: (r.rating_value + r.rating_effectiveness + r.rating_punctuality) / 3,
  }));
  const instructors = allInstructors ?? [];

  if (!reviews.length) {
    return NextResponse.json(
      [...instructors]
        .sort((a, b) => b.avg_overall - a.avg_overall)
        .slice(0, 50)
        .map((i, idx) => ({
          rank: idx + 1,
          instructorId: i.id,
          instructorName: i.full_name,
          instructorPhotoUrl: i.avatar_url,
          location: i.teaching_locations,
          avgScore: i.avg_overall,
          reviewCount: i.total_reviews,
          claimed: i.is_claimed,
        }))
    );
  }

  const reviewedIds = [...new Set(reviews.map((r) => r.instructor_id))];
  const scored = instructors.map((i) => {
    const mine = reviews.filter((r) => r.instructor_id === i.id);
    const myScore = mine.length
      ? mine.reduce((s, r) => s + r.overall_score, 0) / mine.length
      : 0;
    const hasMyReview = reviewedIds.includes(i.id);
    const blendedScore = hasMyReview
      ? myScore * 0.7 + i.avg_overall * 0.3
      : i.avg_overall * 0.5;
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
      instructorName: i.full_name,
      instructorPhotoUrl: i.avatar_url,
      location: i.teaching_locations,
      avgScore: i.avg_overall,
      reviewCount: i.total_reviews,
      claimed: i.is_claimed,
    }))
  );
}
