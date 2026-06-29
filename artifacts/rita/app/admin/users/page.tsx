import { createServiceClient } from "@/lib/supabase/server";
import { UserAdminTable } from "@/components/admin/UserAdminTable";

export default async function AdminUsersPage() {
  const supabase = createServiceClient();
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Users</h1>
      <UserAdminTable users={users || []} />
    </div>
  );
}
