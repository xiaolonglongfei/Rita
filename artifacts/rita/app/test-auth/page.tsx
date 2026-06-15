import { createClient } from '@/lib/supabase/server'

export default async function TestAuthPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>Auth Debug</h1>
      <p><strong>User:</strong> {user ? user.email : 'null'}</p>
      <p><strong>User ID:</strong> {user ? user.id : 'null'}</p>
      <p><strong>Error:</strong> {error ? error.message : 'none'}</p>
    </div>
  )
}
