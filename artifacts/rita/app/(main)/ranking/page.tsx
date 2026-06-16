import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PrivateRankingList } from "@/components/ranking/PrivateRankingList";

export default async function RankingPage() {
  const supabase = await createClient();
  const db = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rankingData } = await db
    .from("student_rankings")
    .select(
      `id, rank_position, instructor_id,
       instructors!student_rankings_instructor_id_fkey (
         id, full_name, avg_value, avg_effectiveness, avg_punctuality, avg_overall, total_reviews
       )`
    )
    .eq("student_id", user.id)
    .order("rank_position", { ascending: true });

  const { data: reviewedInstructors } = await db
    .from("reviews")
    .select(
      `instructor_id,
       instructors!reviews_instructor_id_fkey (
         id, full_name, avg_value, avg_effectiveness, avg_punctuality, avg_overall, total_reviews
       )`
    )
    .eq("student_id", user.id);

  type InstructorRow = {
    id: string;
    full_name: string;
    avg_value: number;
    avg_effectiveness: number;
    avg_punctuality: number;
    avg_overall: number;
    total_reviews: number;
  };

  const rankedIds = new Set(
    ((rankingData ?? []) as unknown as Array<{ instructor_id: string }>).map(
      (r) => r.instructor_id
    )
  );

  const unrankedInstructors: InstructorRow[] = (
    (reviewedInstructors ?? []) as unknown as Array<{ instructor_id: string; instructors: InstructorRow }>
  )
    .filter((r) => !rankedIds.has(r.instructor_id))
    .map((r) => r.instructors)
    .filter(
      (v, i, a) => v && a.findIndex((t) => t?.id === v.id) === i
    )
    .filter(Boolean) as InstructorRow[];

  const rankedInstructors = (
    (rankingData ?? []) as unknown as Array<{
      id: string;
      rank_position: number;
      instructor_id: string;
      instructors: InstructorRow;
    }>
  ).map((r) => ({
    rankId: r.id,
    position: r.rank_position,
    ...r.instructors,
  }));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Instructor Ranking</h1>
          <p className="text-sm text-slate-500 mt-1">Drag to reorder. Only you can see this list.</p>
        </div>

        <PrivateRankingList
          initialRanked={rankedInstructors}
          unranked={unrankedInstructors}
          studentId={user.id}
        />
      </div>
    </div>
  );
}
