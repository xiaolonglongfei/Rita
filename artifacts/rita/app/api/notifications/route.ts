import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Older review-submitted notifications did not store related IDs, so also
  // suppress their stored name-based messages without changing the records.
  const removed: { id: string; full_name: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data: page, error: privacyError } = await db.from("instructors")
      .select("id, full_name").not("opted_out_at", "is", null)
      .order("id").range(offset, offset + 999);
    if (privacyError) return NextResponse.json({ error: "Unable to load notifications" }, { status: 500 });
    removed.push(...(page ?? []));
    if (!page || page.length < 1000) break;
  }
  const removedIds = new Set(removed.map((coach) => coach.id));
  const relatedReviews = (data ?? []).flatMap((n) => n.related_review_id ? [n.related_review_id] : []);
  const { data: reviews, error: reviewError } = relatedReviews.length
    ? await db.from("reviews").select("id, instructor_id").in("id", relatedReviews)
    : { data: [], error: null };
  if (reviewError) return NextResponse.json({ error: "Unable to load notifications" }, { status: 500 });
  const hiddenReviews = new Set((reviews ?? []).filter((r) => removedIds.has(r.instructor_id)).map((r) => r.id));
  return NextResponse.json((data ?? []).filter((n) =>
    !removedIds.has(n.related_instructor_id) && !hiddenReviews.has(n.related_review_id) &&
    !removed.some((coach) => coach.full_name && n.message?.toLowerCase().includes(coach.full_name.toLowerCase()))
  ));
}

export async function PATCH() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  await db.from("notifications").update({ is_read: true }).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
