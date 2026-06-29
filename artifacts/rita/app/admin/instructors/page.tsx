import { createServiceClient } from "@/lib/supabase/server";
import { InstructorAdminTable } from "@/components/admin/InstructorAdminTable";

export default async function AdminInstructorsPage() {
  const supabase = createServiceClient();
  const { data: instructors } = await supabase
    .from("instructors")
    .select("*")
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
