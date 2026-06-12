import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { AdminCreateInstructorBody, AdminUpdateInstructorBody, AdminUpdateUserBody, AdminModerateReviewBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { moderateReview } from "./reviews";

const router: IRouter = Router();

type InstructorRow = {
  id: number;
  name: string;
  bio: string | null;
  specialty: string;
  photo_url: string | null;
  location: string | null;
  verified: boolean;
  avg_score: number;
  avg_value: number;
  avg_effectiveness: number;
  avg_punctuality: number;
  review_count: number;
  public_rank: number | null;
  created_at: string;
};

type UserRow = {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
};

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
  created_at: string;
};

async function loadAdminUser(req: Parameters<typeof requireAuth>[0], res: Parameters<typeof requireAuth>[1]): Promise<boolean> {
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", req.session.userId!).single();
  if (!user) { res.status(401).json({ error: "User not found" }); return false; }
  if (!(user as { is_admin: boolean }).is_admin) { res.status(403).json({ error: "Admin access required" }); return false; }
  return true;
}

function formatInstructor(i: InstructorRow) {
  return {
    id: i.id,
    name: i.name,
    bio: i.bio ?? null,
    specialty: i.specialty,
    photoUrl: i.photo_url ?? null,
    location: i.location ?? null,
    verified: i.verified,
    avgScore: i.avg_score,
    avgValue: i.avg_value,
    avgEffectiveness: i.avg_effectiveness,
    avgPunctuality: i.avg_punctuality,
    reviewCount: i.review_count,
    publicRank: i.public_rank ?? null,
    createdAt: i.created_at,
  };
}

router.get("/admin/instructors", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const { data, error } = await supabase.from("instructors").select("*");
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json((data as InstructorRow[]).map(formatInstructor));
});

router.post("/admin/instructors", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const parsed = AdminCreateInstructorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { data, error } = await supabase
    .from("instructors")
    .insert({
      name: parsed.data.name,
      specialty: parsed.data.specialty,
      bio: parsed.data.bio ?? null,
      photo_url: parsed.data.photoUrl ?? null,
      location: parsed.data.location ?? null,
    })
    .select("*")
    .single();

  if (error || !data) { res.status(500).json({ error: "Failed to create instructor" }); return; }
  res.status(201).json(formatInstructor(data as InstructorRow));
});

router.patch("/admin/instructors/:id", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = AdminUpdateInstructorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name != null)      updates.name      = parsed.data.name;
  if (parsed.data.specialty != null) updates.specialty = parsed.data.specialty;
  if (parsed.data.bio != null)       updates.bio       = parsed.data.bio;
  if (parsed.data.photoUrl != null)  updates.photo_url = parsed.data.photoUrl;
  if (parsed.data.location != null)  updates.location  = parsed.data.location;
  if (parsed.data.verified != null)  updates.verified  = parsed.data.verified;

  const { data, error } = await supabase
    .from("instructors")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) { res.status(404).json({ error: "Instructor not found" }); return; }
  res.json(formatInstructor(data as InstructorRow));
});

router.delete("/admin/instructors/:id", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await supabase.from("instructors").delete().eq("id", id);
  res.sendStatus(204);
});

router.get("/admin/users", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const [{ data: users }, { data: reviews }, { data: sessions }] = await Promise.all([
    supabase.from("users").select("*"),
    supabase.from("reviews").select("user_id"),
    supabase.from("sessions").select("user_id"),
  ]);

  const allReviews = (reviews ?? []) as { user_id: number }[];
  const allSessions = (sessions ?? []) as { user_id: number }[];

  res.json((users as UserRow[]).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatar_url ?? null,
    isAdmin: u.is_admin,
    reviewCount: allReviews.filter(r => r.user_id === u.id).length,
    sessionCount: allSessions.filter(s => s.user_id === u.id).length,
    createdAt: u.created_at,
  })));
});

router.patch("/admin/users/:id", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = AdminUpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.isAdmin != null) updates.is_admin = parsed.data.isAdmin;
  if (parsed.data.name != null)    updates.name     = parsed.data.name;

  const [{ data: user }, { data: reviews }, { data: sessions }] = await Promise.all([
    supabase.from("users").update(updates).eq("id", id).select("*").single(),
    supabase.from("reviews").select("user_id").eq("user_id", id),
    supabase.from("sessions").select("user_id").eq("user_id", id),
  ]);

  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const u = user as UserRow;
  res.json({
    id: u.id, email: u.email, name: u.name, avatarUrl: u.avatar_url ?? null,
    isAdmin: u.is_admin,
    reviewCount: (reviews ?? []).length,
    sessionCount: (sessions ?? []).length,
    createdAt: u.created_at,
  });
});

router.get("/admin/moderation", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const { data, error } = await supabase
    .from("reviews")
    .select("*, instructors(name), users(name, avatar_url)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json((data as (ReviewRow & { instructors: { name: string } | null; users: { name: string; avatar_url: string | null } | null })[])
    .map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.users?.name ?? null,
      userAvatarUrl: r.users?.avatar_url ?? null,
      instructorId: r.instructor_id,
      instructorName: r.instructors?.name ?? null,
      sessionId: r.session_id ?? null,
      value: r.value,
      effectiveness: r.effectiveness,
      punctuality: r.punctuality,
      overallScore: r.overall_score,
      comment: r.comment ?? null,
      status: r.status as "pending" | "approved" | "rejected",
      createdAt: r.created_at,
    })));
});

router.patch("/admin/moderation/:reviewId", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const raw = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
  const reviewId = parseInt(raw, 10);
  if (isNaN(reviewId)) { res.status(400).json({ error: "Invalid reviewId" }); return; }

  const parsed = AdminModerateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const review = await moderateReview(reviewId, parsed.data.status, parsed.data.moderationNote ?? undefined);
  if (!review) { res.status(404).json({ error: "Review not found" }); return; }

  res.json({
    id: review.id, userId: review.user_id, userName: null, userAvatarUrl: null,
    instructorId: review.instructor_id, instructorName: null,
    sessionId: review.session_id ?? null,
    value: review.value, effectiveness: review.effectiveness, punctuality: review.punctuality,
    overallScore: review.overall_score,
    comment: review.comment ?? null,
    status: review.status as "pending" | "approved" | "rejected",
    createdAt: review.created_at,
  });
});

export default router;
