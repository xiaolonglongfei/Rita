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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read action from formData (HTML form) or JSON body
  let action: string | null = null;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    action = body.action ?? null;
  } else {
    const formData = await request.formData().catch(() => null);
    action = (formData?.get("action") as string | null) ?? null;
  }

  if (action !== "confirm" && action !== "deny") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const db = createServiceClient();

  // Verify this user is a claimed instructor
  const { data: instructorProfile } = await db
    .from("instructors")
    .select("id")
    .eq("claimed_by", user.id)
    .single();

  if (!instructorProfile) {
    return NextResponse.json({ error: "Not an instructor" }, { status: 403 });
  }

  // Verify the review belongs to this instructor
  const { data: review } = await db
    .from("reviews")
    .select("id, instructor_id")
    .eq("id", id)
    .eq("instructor_id", instructorProfile.id)
    .single();

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (action === "confirm") {
    await db.from("reviews").update({ is_verified: true }).eq("id", id);
  }
  // deny: review stays as-is (is_verified remains false)

  // Redirect back to sessions page
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/sessions`, { status: 303 });
}
