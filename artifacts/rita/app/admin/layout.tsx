import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-rita-gray-light">
      <nav className="bg-rita-charcoal text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-8">
          <Link href="/" className="font-bold text-lg">
            Rita<span className="text-rita-lime">.</span>{" "}
            <span className="text-slate-400 text-sm font-normal">Admin</span>
          </Link>
          <Link href="/admin" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
          <Link href="/admin/instructors" className="text-sm text-slate-300 hover:text-white">Instructors</Link>
          <Link href="/admin/moderation" className="text-sm text-slate-300 hover:text-white">Moderation</Link>
          <Link href="/admin/users" className="text-sm text-slate-300 hover:text-white">Users</Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
