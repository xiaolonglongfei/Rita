import { createClient, createServiceClient } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const db = createServiceClient();

  let instructorProfile: { id: string; full_name: string } | null = null;
  let pendingCount = 0;

  if (user) {
    const { data: profile } = await db
      .from("instructors")
      .select("id, full_name")
      .eq("claimed_by", user.id)
      .single();

    if (profile) {
      instructorProfile = profile as { id: string; full_name: string };

      const { count } = await db
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", profile.id)
        .eq("is_verified", false)
        .eq("moderation_status", "approved");

      pendingCount = count ?? 0;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        initialUser={user}
        instructorProfile={instructorProfile}
        pendingCount={pendingCount}
      />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
