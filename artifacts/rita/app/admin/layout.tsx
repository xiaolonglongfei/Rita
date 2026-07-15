import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!userData?.is_admin) redirect("/");

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-bold text-lg">
              Rovi<span style={{ color: "#f97316" }}>.</span> Admin
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/admin/instructors" className="text-slate-300 hover:text-white transition-colors">
                Instructors
              </Link>
              <Link href="/admin/moderation" className="text-slate-300 hover:text-white transition-colors">
                Moderation
              </Link>
              <Link href="/admin/users" className="text-slate-300 hover:text-white transition-colors">
                Users
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">{userData.full_name}</span>
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              ← Back to site
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
