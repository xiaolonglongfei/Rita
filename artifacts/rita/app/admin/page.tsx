import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createServiceClient();

  const [
    { count: instructorCount },
    { count: reviewCount },
    { count: pendingCount },
    { count: userCount },
  ] = await Promise.all([
    supabase.from("instructors").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("users").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Instructors", value: instructorCount ?? 0 },
    { label: "Approved Reviews", value: reviewCount ?? 0 },
    { label: "Pending Moderation", value: pendingCount ?? 0, alert: (pendingCount ?? 0) > 0 },
    { label: "Registered Users", value: userCount ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-rita-charcoal mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-2xl p-5 border ${s.alert ? "border-orange-300" : "border-slate-100"}`}
          >
            <div className={`text-3xl font-extrabold mb-1 ${s.alert ? "text-orange-500" : "text-rita-blue"}`}>
              {s.value}
            </div>
            <div className="text-sm text-rita-gray">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
