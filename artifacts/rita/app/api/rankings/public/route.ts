import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const db = createServiceClient();
  const { data, error } = await db
    .from("instructors")
    .select("id, full_name, avatar_url, teaching_locations, avg_overall, avg_value, avg_effectiveness, avg_punctuality, total_reviews, is_claimed")
    .gt("total_reviews", 0)
    .order("avg_overall", { ascending: false })
    .order("total_reviews", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((i, idx) => ({
      rank: idx + 1,
      instructorId: i.id,
      instructorName: i.full_name,
      instructorPhotoUrl: i.avatar_url,
      location: i.teaching_locations,
      avgScore: i.avg_overall,
      avgValue: i.avg_value,
      avgEffectiveness: i.avg_effectiveness,
      avgPunctuality: i.avg_punctuality,
      reviewCount: i.total_reviews,
      claimed: i.is_claimed,
    }))
  );
}
