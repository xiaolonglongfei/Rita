import { createServiceClient } from "@/lib/supabase/server";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export default async function AdminModerationPage() {
  const supabase = createServiceClient();

  const { data: flaggedReviews } = await supabase
    .from("reviews")
    .select(
      `id, rating_value, rating_effectiveness, rating_punctuality,
       comment, is_flagged, flag_reason, moderation_status, session_date,
       student_id, instructor_id,
       users!reviews_student_id_fkey (full_name, email),
       instructors!reviews_instructor_id_fkey (full_name)`
    )
    .or("is_flagged.eq.true,moderation_status.eq.pending_review")
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = (flaggedReviews || []) as unknown as any[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Moderation Queue</h1>
      <p className="text-sm text-slate-500 mb-6">
        Flagged or pending reviews requiring manual review.
      </p>
      <ModerationQueue reviews={reviews} />
    </div>
  );
}
