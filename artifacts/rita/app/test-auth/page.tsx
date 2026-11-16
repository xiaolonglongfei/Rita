import { createClient } from '@/lib/supabase/server'
import { notFound } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

export default async function TestAuthPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <a href="/" className="mb-6 inline-block text-2xl font-bold text-slate-800">
        Rovi<span className="text-rita-lime">.</span>
      </a>
      <h1>Auth Debug</h1>
      <p><strong>User:</strong> {user ? user.email : 'null'}</p>
      <p><strong>User ID:</strong> {user ? user.id : 'null'}</p>
      <p><strong>Error:</strong> {error ? error.message : 'none'}</p>
    </div>
  )
}
