import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createServiceClient();

  const [{ data: instructor, error }, { data: reviews }] = await Promise.all([
    db.from("instructors").select("*").eq("id", parseInt(id)).single(),
    db
      .from("reviews")
      .select("*, users(name, avatar_url)")
      .eq("instructor_id", parseInt(id))
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (error || !instructor)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    instructor: {
      id: instructor.id,
      name: instructor.name,
      bio: instructor.bio,
      specialty: instructor.specialty,
      photoUrl: instructor.photo_url,
      location: instructor.location,
      verified: instructor.verified,
      avgScore: instructor.avg_score,
      avgValue: instructor.avg_value,
      avgEffectiveness: instructor.avg_effectiveness,
      avgPunctuality: instructor.avg_punctuality,
      reviewCount: instructor.review_count,
      publicRank: instructor.public_rank,
      createdAt: instructor.created_at,
    },
    reviews: (reviews ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: (r.users as { name: string } | null)?.name ?? "Anonymous",
      value: r.value,
      effectiveness: r.effectiveness,
      punctuality: r.punctuality,
      overallScore: r.overall_score,
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at,
    })),
  });
}
