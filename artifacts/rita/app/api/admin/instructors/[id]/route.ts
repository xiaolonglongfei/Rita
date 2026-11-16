import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseBioSource } from "@/lib/instructor-bio-source";
import { bioSourcePermissionsReady } from "@/lib/bio-source-access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createServiceClient();
  const { data: account, error: roleError } = await db.from("users").select("is_admin").eq("id", user.id).maybeSingle();
  if (roleError) return NextResponse.json({ error: "Unable to check your account." }, { status: 500 });
  if (account?.is_admin !== true) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Please check the details and try again." }, { status: 400 });
  }
  const parsed = parseBioSource(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (Object.values(parsed.values).some((value) => value !== null) && !(await bioSourcePermissionsReady())) {
    return NextResponse.json({ error: "Bio source privacy permissions are not configured yet. Apply the supplied database privacy SQL before saving source details." }, { status: 503 });
  }
  const updates: Record<string, string | null> = { ...parsed.values };
  // Preserve the existing internal-notes editor's request contract.
  if (Object.prototype.hasOwnProperty.call(body, "internalNotes")) {
    if (typeof body.internalNotes !== "string") return NextResponse.json({ error: "Internal notes must be text." }, { status: 400 });
    updates.internal_notes = body.internalNotes || null;
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No editable details were provided." }, { status: 400 });
  const { data, error } = await db.from("instructors").update(updates).eq("id", id)
    .select("id, internal_notes, bio_source_url, bio_source_checked_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to save instructor details. Please try again." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ instructor: data });
}
