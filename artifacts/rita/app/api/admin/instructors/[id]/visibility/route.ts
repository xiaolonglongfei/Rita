import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const body = await request.json().catch(() => null);
  if (!body || !["opt_out", "restore"].includes(body.action)) {
    return NextResponse.json({ error: "Choose Opt out or Restore." }, { status: 400 });
  }
  const optingOut = body.action === "opt_out";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (optingOut && !reason) {
    return NextResponse.json({ error: "Please provide a reason for opting out this coach." }, { status: 400 });
  }
  const { data: instructor, error: readError } = await db.from("instructors")
    .select("id, internal_notes, opted_out_at, is_active").eq("id", id).maybeSingle();
  if (readError) return NextResponse.json({ error: "Unable to load this instructor." }, { status: 500 });
  if (!instructor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (optingOut === (instructor.opted_out_at != null)) {
    return NextResponse.json({ error: "This instructor's status changed. Refresh and try again." }, { status: 409 });
  }
  const timestamp = new Date().toISOString();
  const entry = `${timestamp} ${optingOut ? `opted out: ${reason}` : "restored"}`;
  const notes = instructor.internal_notes ? `${instructor.internal_notes}\n${entry}` : entry;
  // Compare-and-swap prevents losing another admin's notes or status changes.
  let update = db.from("instructors").update({
    opted_out_at: optingOut ? timestamp : null,
    is_active: !optingOut,
    internal_notes: notes,
  }).eq("id", id);
  for (const field of ["internal_notes", "opted_out_at", "is_active"] as const) {
    update = instructor[field] == null
      ? update.is(field, null)
      : update.eq(field, instructor[field]);
  }
  const { data, error } = await update
    .select("id, opted_out_at, is_active, internal_notes").maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to update this instructor." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "This instructor changed. Refresh and try again." }, { status: 409 });
  return NextResponse.json({ instructor: data });
}
