import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-rita-charcoal mb-6">Users</h1>
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        {(data ?? []).length === 0 ? (
          <div className="p-8 text-center text-rita-gray">No users yet.</div>
        ) : (
          (data ?? []).map((u, idx) => (
            <div
              key={u.id}
              className={`flex items-center gap-4 px-6 py-4 ${
                idx !== (data?.length ?? 0) - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-rita-blue-light flex items-center justify-center text-rita-blue font-bold text-sm flex-shrink-0">
                {u.full_name?.[0]?.toUpperCase() ?? u.email?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-rita-charcoal">{u.full_name ?? u.email}</div>
                <div className="text-xs text-rita-gray">{u.email}</div>
              </div>
              {u.is_admin && (
                <span className="text-xs bg-rita-lime-light text-rita-lime-dark px-2 py-0.5 rounded-full font-semibold">
                  Admin
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
