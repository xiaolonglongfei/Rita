import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data: userData } = await db
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!userData?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await request.json();
  if (action !== "approve" && action !== "remove") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "approved" : "removed";

  await db
    .from("reviews")
    .update({ moderation_status: newStatus, is_flagged: false })
    .eq("id", id);

  // Log the moderation action (best-effort)
  try {
    await db.from("moderation_log").insert({
      review_id: id,
      action: newStatus,
      performed_by: user.id,
      performed_by_type: "admin",
    });
  } catch {
    // non-critical, ignore
  }

  return NextResponse.json({ success: true });
}
