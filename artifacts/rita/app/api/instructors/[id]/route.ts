import { query, queryOne } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const instructorId = parseInt(id);

  const [instructor, reviews] = await Promise.all([
    queryOne(`SELECT * FROM instructors WHERE id = $1`, [instructorId]),
    query(
      `SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.instructor_id = $1 AND r.status = 'approved'
       ORDER BY r.created_at DESC LIMIT 50`,
      [instructorId]
    ),
  ]);

  if (!instructor) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    reviews: reviews.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name ?? "Anonymous",
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
