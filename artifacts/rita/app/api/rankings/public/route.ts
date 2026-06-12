import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const rows = await query(
    `SELECT id, name, photo_url, specialty, avg_score, review_count, verified
     FROM instructors
     WHERE review_count > 0
     ORDER BY avg_score DESC, review_count DESC
     LIMIT $1`,
    [limit]
  );

  return NextResponse.json(
    rows.map((i, idx) => ({
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
