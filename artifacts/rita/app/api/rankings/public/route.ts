import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const db = createServiceClient();
  const { data, error } = await db
    .from("instructors")
    .select("id, name, photo_url, specialty, avg_score, review_count, verified")
    .gt("review_count", 0)
    .order("avg_score", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((i, idx) => ({
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
