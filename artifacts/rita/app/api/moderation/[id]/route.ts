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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { action, moderationNote } = body;
  if (action !== "approve" && action !== "remove" && action !== "comment_removed") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (moderationNote != null && (typeof moderationNote !== "string" || moderationNote.length > 500)) {
    return NextResponse.json({ error: "Internal notes must be 500 characters or fewer." }, { status: 400 });
  }
  const note = typeof moderationNote === "string" ? moderationNote.trim() || null : null;

  if (action === "comment_removed") {
    const { data: review, error: readError } = await db
      .from("reviews").select("id, comment").eq("id", id).maybeSingle();
    if (readError) return NextResponse.json({ error: "Could not load the review." }, { status: 500 });
    if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    if (review.comment === null) {
      return NextResponse.json({ error: "This review has no comment to remove." }, { status: 409 });
    }

    // Write the audit entry first: a restrictive action CHECK must not cause an
    // unlogged comment removal. Never change the schema from this endpoint.
    const { data: log, error: logError } = await db.from("moderation_log").insert({
      review_id: id,
      action: "comment_removed",
      performed_by: user.id,
      performed_by_type: "admin",
      note,
    }).select("id").single();
    if (logError || !log) {
      return NextResponse.json({
        error: "Could not log comment removal. Check that moderation_log.action allows comment_removed. No review was changed.",
      }, { status: 500 });
    }

    const { data: updated, error: updateError } = await db.from("reviews")
      .update({ comment: null, moderation_note: note })
      .eq("id", id).select("id").maybeSingle();
    if (updateError || !updated) {
      // Compensate for the failed update so the audit does not claim a removal.
      const { error: cleanupError } = await db.from("moderation_log").delete().eq("id", log.id);
      if (cleanupError) console.error("Failed to clean up unsuccessful comment-removal log:", cleanupError.code);
      return NextResponse.json({ error: "Could not remove the comment. Please refresh and try again." }, { status: 500 });
    }
    return NextResponse.json({ success: true, moderationNote: note });
  }

  const newStatus = action === "approve" ? "approved" : "removed";

  const { error: updateError } = await db
    .from("reviews")
    .update({ moderation_status: newStatus, is_flagged: false, moderation_note: note })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: "Could not update the review. Please try again." }, { status: 500 });
  }

  // Log the moderation action (best-effort)
  try {
    await db.from("moderation_log").insert({
      review_id: id,
      action: newStatus,
      performed_by: user.id,
      performed_by_type: "admin",
      note,
    });
  } catch {
    // non-critical, ignore
  }

  return NextResponse.json({ success: true });
}
