import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createServiceClient();
  const { data: account, error: roleError } = await db.from("users")
    .select("is_admin").eq("id", user.id).maybeSingle();
  if (roleError) return NextResponse.json({ error: "Unable to check your account" }, { status: 500 });
  if (account?.is_admin !== true) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { data, error } = await db.from("instructors").update({ is_active: true })
    .eq("id", id).eq("created_by_source", "student").eq("is_active", false)
    .is("opted_out_at", null).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to approve this instructor" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ instructor: data });
}
