import { createServiceClient } from "@/lib/supabase/server";
import { InstructorAdminTable } from "@/components/admin/InstructorAdminTable";

export default async function AdminInstructorsPage() {
  const supabase = createServiceClient();
  const { data: instructors } = await supabase
    .from("instructors")
    .select("id, full_name, bio, teaching_locations, internal_notes, is_claimed, avg_overall, total_reviews, opted_out_at, is_active, created_by_source, bio_source_url, bio_source_checked_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Instructors</h1>
      </div>
      <InstructorAdminTable instructors={instructors || []} />
    </div>
  );
}
