import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { PUBLIC_REVIEW_FIELDS, toPublicReview } from "@/lib/public-review";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServiceClient();

  const { data: instructor, error } = await db.from("instructors")
    .select("id, full_name, bio, avatar_url, teaching_locations, is_claimed, reviews_visible, avg_overall, avg_value, avg_effectiveness, avg_punctuality, total_reviews, created_at")
    .eq("id", id).is("opted_out_at", null).maybeSingle();
  if (error || !instructor)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scoresVisible = instructor.reviews_visible === true;
  const { data: reviews, error: reviewsError } = scoresVisible ? await db
      .from("reviews")
      .select(PUBLIC_REVIEW_FIELDS)
      .eq("instructor_id", id)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(50) : { data: [], error: null };

  if (reviewsError)
    return NextResponse.json({ error: "Unable to load reviews" }, { status: 500 });

  return NextResponse.json({
    instructor: {
      id: instructor.id,
      name: instructor.full_name,
      bio: instructor.bio,
      photoUrl: instructor.avatar_url,
      location: instructor.teaching_locations,
      claimed: instructor.is_claimed,
      reviewsVisible: scoresVisible,
      avgScore: scoresVisible ? instructor.avg_overall : null,
      avgValue: scoresVisible ? instructor.avg_value : null,
      avgEffectiveness: scoresVisible ? instructor.avg_effectiveness : null,
      avgPunctuality: scoresVisible ? instructor.avg_punctuality : null,
      reviewCount: instructor.total_reviews,
      createdAt: instructor.created_at,
    },
    reviews: scoresVisible ? (reviews ?? []).map(toPublicReview) : [],
  });
}
