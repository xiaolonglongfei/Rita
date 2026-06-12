import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { CreateReviewBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { recomputeInstructorStats } from "./instructors";

const router: IRouter = Router();

type ReviewRow = {
  id: number;
  user_id: number;
  instructor_id: number;
  session_id: number | null;
  value: number;
  effectiveness: number;
  punctuality: number;
  overall_score: number;
  comment: string | null;
  status: string;
  moderation_note: string | null;
  created_at: string;
};

function formatReview(
  r: ReviewRow,
  userName?: string | null,
  userAvatarUrl?: string | null,
  instructorName?: string | null,
) {
  return {
    id: r.id,
    userId: r.user_id,
    userName: userName ?? null,
    userAvatarUrl: userAvatarUrl ?? null,
    instructorId: r.instructor_id,
    instructorName: instructorName ?? null,
    sessionId: r.session_id ?? null,
    value: r.value,
    effectiveness: r.effectiveness,
    punctuality: r.punctuality,
    overallScore: r.overall_score,
    comment: r.comment ?? null,
    status: r.status as "pending" | "approved" | "rejected",
    createdAt: r.created_at,
  };
}

router.get("/reviews", requireAuth, async (req, res): Promise<void> => {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, instructors(name), users(name, avatar_url)")
    .eq("user_id", req.session.userId!)
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json((data as (ReviewRow & { instructors: { name: string } | null; users: { name: string; avatar_url: string | null } | null })[])
    .map(r => formatReview(r, r.users?.name, r.users?.avatar_url, r.instructors?.name)));
});

router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { instructorId, sessionId, value, effectiveness, punctuality, comment } = parsed.data;
  const overallScore = (value + effectiveness + punctuality) / 3;

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      user_id: req.session.userId!,
      instructor_id: instructorId,
      session_id: sessionId ?? null,
      value,
      effectiveness,
      punctuality,
      overall_score: overallScore,
      comment: comment ?? null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !review) { res.status(500).json({ error: "Failed to submit review" }); return; }

  const [{ data: instructor }, { data: user }] = await Promise.all([
    supabase.from("instructors").select("name").eq("id", instructorId).single(),
    supabase.from("users").select("name, avatar_url").eq("id", req.session.userId!).single(),
  ]);

  await supabase.from("notifications").insert({
    user_id: req.session.userId!,
    type: "review_submitted",
    message: `Your review for ${(instructor as { name: string } | null)?.name ?? "instructor"} has been submitted and is awaiting moderation.`,
  });

  const u = user as { name: string; avatar_url: string | null } | null;
  res.status(201).json(formatReview(review as ReviewRow, u?.name, u?.avatar_url, (instructor as { name: string } | null)?.name));
});

router.get("/reviews/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data, error } = await supabase
    .from("reviews")
    .select("*, instructors(name), users(name, avatar_url)")
    .eq("id", id)
    .single();

  if (error || !data) { res.status(404).json({ error: "Review not found" }); return; }
  const r = data as ReviewRow & { instructors: { name: string } | null; users: { name: string; avatar_url: string | null } | null };
  res.json(formatReview(r, r.users?.name, r.users?.avatar_url, r.instructors?.name));
});

export async function moderateReview(reviewId: number, status: "approved" | "rejected", moderationNote?: string) {
  await supabase
    .from("reviews")
    .update({ status, moderation_note: moderationNote ?? null })
    .eq("id", reviewId);

  const { data: review } = await supabase.from("reviews").select("*").eq("id", reviewId).single();
  if (!review) return undefined;

  const r = review as ReviewRow;
  await recomputeInstructorStats(r.instructor_id);

  await supabase.from("notifications").insert({
    user_id: r.user_id,
    type: status === "approved" ? "review_approved" : "review_rejected",
    message: status === "approved"
      ? "Your review has been approved and is now visible."
      : `Your review was not approved${moderationNote ? `: ${moderationNote}` : "."}`,
  });

  return r;
}

export default router;
