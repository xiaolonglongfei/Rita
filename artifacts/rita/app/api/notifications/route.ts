import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [user.id]
  );

  return NextResponse.json(rows);
}

export async function PATCH() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await query(
    `UPDATE notifications SET read = true WHERE user_id = $1`,
    [user.id]
  );

  return NextResponse.json({ ok: true });
}
