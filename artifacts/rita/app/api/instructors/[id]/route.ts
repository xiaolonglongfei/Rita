import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServiceClient();

  const [{ data: instructor, error }, { data: reviews }] = await Promise.all([
    db.from("instructors").select("*").eq("id", id).single(),
    db
      .from("reviews")
      .select("*, users(full_name, avatar_url)")
      .eq("instructor_id", id)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (error || !instructor)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    instructor: {
      id: instructor.id,
      name: instructor.full_name,
      bio: instructor.bio,
      photoUrl: instructor.avatar_url,
      location: instructor.teaching_locations,
      claimed: instructor.is_claimed,
      avgScore: instructor.avg_overall,
      avgValue: instructor.avg_value,
      avgEffectiveness: instructor.avg_effectiveness,
      avgPunctuality: instructor.avg_punctuality,
      reviewCount: instructor.total_reviews,
      createdAt: instructor.created_at,
    },
    reviews: (reviews ?? []).map((r) => {
      const overallScore = (r.rating_value + r.rating_effectiveness + r.rating_punctuality) / 3;
      return {
        id: r.id,
        userId: r.student_id,
        userName: (r.users as { full_name: string } | null)?.full_name ?? "Anonymous",
        value: r.rating_value,
        effectiveness: r.rating_effectiveness,
        punctuality: r.rating_punctuality,
        overallScore,
        comment: r.comment,
        status: r.moderation_status,
        createdAt: r.created_at,
      };
    }),
  });
}
