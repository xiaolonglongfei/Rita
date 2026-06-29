import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const db = createServiceClient();

  const [
    { count: instructorCount },
    { count: studentCount },
    { count: reviewCount },
    { count: pendingModerationCount },
    { count: pendingVerificationCount },
  ] = await Promise.all([
    db.from("instructors").select("*", { count: "exact", head: true }),
    db.from("users").select("*", { count: "exact", head: true }),
    db
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("moderation_status", "approved"),
    db
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("moderation_status", "pending_review"),
    db
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", false),
  ]);

  // Suppress unused variable warning — supabase is used for auth in layout
  void supabase;

  const stats = [
    { label: "Total Instructors", value: instructorCount ?? 0, icon: "🎾" },
    { label: "Total Students", value: studentCount ?? 0, icon: "👤" },
    { label: "Approved Reviews", value: reviewCount ?? 0, icon: "⭐" },
    { label: "Pending Moderation", value: pendingModerationCount ?? 0, icon: "🚩" },
    { label: "Unverified Sessions", value: pendingVerificationCount ?? 0, icon: "⏳" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold" style={{ color: "#f97316" }}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
