import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data } = await db
    .from("student_rankings")
    .select("id, student_id, instructor_id, rank_position, instructors!inner(id, full_name, avatar_url, teaching_locations, is_claimed, avg_overall, avg_value, avg_effectiveness, avg_punctuality, total_reviews, reviews_visible)")
    .is("instructors.opted_out_at", null)
    .eq("instructors.is_active", true)
    .eq("student_id", user.id)
    .order("rank_position", { ascending: true });

  return NextResponse.json({ rankings: data });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rankings } = await request.json();

  const db = createServiceClient();

  if (rankings?.length) {
    const ids = [...new Set<string>(rankings.map((r: { instructor_id: string }) => r.instructor_id))];
    const { data, error } = await db.from("instructors").select("id")
      .in("id", ids).is("opted_out_at", null).eq("is_active", true);
    if (error) return NextResponse.json({ error: "Unable to load instructors" }, { status: 500 });
    if (data.length !== ids.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  await db.from("student_rankings").delete().eq("student_id", user.id);

  if (rankings && rankings.length > 0) {
    const { error } = await db.from("student_rankings").insert(
      rankings.map((r: { instructor_id: string; rank_position: number }) => ({
        student_id: user.id,
        instructor_id: r.instructor_id,
        rank_position: r.rank_position,
      }))
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
