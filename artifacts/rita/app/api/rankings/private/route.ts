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
    .select("*, instructors(*)")
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
