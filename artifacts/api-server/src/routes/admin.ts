import { Router, type IRouter } from "express";
import { db, instructorsTable, usersTable, reviewsTable, sessionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { AdminCreateInstructorBody, AdminUpdateInstructorBody, AdminUpdateInstructorParams, AdminDeleteInstructorParams, AdminUpdateUserBody, AdminUpdateUserParams, AdminModerateReviewBody, AdminModerateReviewParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { moderateReview } from "./reviews";

const router: IRouter = Router();

function assertAdmin(req: Parameters<typeof requireAuth>[0], res: Parameters<typeof requireAuth>[1]): boolean {
  const user = (req as typeof req & { adminUser?: { isAdmin: boolean } }).adminUser;
  if (!user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

async function loadAdminUser(req: Parameters<typeof requireAuth>[0], res: Parameters<typeof requireAuth>[1]): Promise<boolean> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) { res.status(401).json({ error: "User not found" }); return false; }
  if (!user.isAdmin) { res.status(403).json({ error: "Admin access required" }); return false; }
  return true;
}

function formatInstructor(instructor: typeof instructorsTable.$inferSelect) {
  return {
    id: instructor.id,
    name: instructor.name,
    bio: instructor.bio ?? null,
    specialty: instructor.specialty,
    photoUrl: instructor.photoUrl ?? null,
    location: instructor.location ?? null,
    verified: instructor.verified,
    avgScore: instructor.avgScore,
    avgValue: instructor.avgValue,
    avgEffectiveness: instructor.avgEffectiveness,
    avgPunctuality: instructor.avgPunctuality,
    reviewCount: instructor.reviewCount,
    publicRank: instructor.publicRank ?? null,
    createdAt: instructor.createdAt.toISOString(),
  };
}

router.get("/admin/instructors", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const instructors = await db.select().from(instructorsTable);
  res.json(instructors.map(formatInstructor));
});

router.post("/admin/instructors", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const parsed = AdminCreateInstructorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [instructor] = await db.insert(instructorsTable).values({
    name: parsed.data.name,
    specialty: parsed.data.specialty,
    bio: parsed.data.bio ?? null,
    photoUrl: parsed.data.photoUrl ?? null,
    location: parsed.data.location ?? null,
  }).returning();
  res.status(201).json(formatInstructor(instructor));
});

router.patch("/admin/instructors/:id", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = AdminUpdateInstructorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.specialty != null) updates.specialty = parsed.data.specialty;
  if (parsed.data.bio != null) updates.bio = parsed.data.bio;
  if (parsed.data.photoUrl != null) updates.photoUrl = parsed.data.photoUrl;
  if (parsed.data.location != null) updates.location = parsed.data.location;
  if (parsed.data.verified != null) updates.verified = parsed.data.verified;
  const [instructor] = await db.update(instructorsTable).set(updates).where(eq(instructorsTable.id, id)).returning();
  if (!instructor) { res.status(404).json({ error: "Instructor not found" }); return; }
  res.json(formatInstructor(instructor));
});

router.delete("/admin/instructors/:id", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(instructorsTable).where(eq(instructorsTable.id, id));
  res.sendStatus(204);
});

router.get("/admin/users", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const users = await db.select().from(usersTable);
  const userIds = users.map(u => u.id);

  const reviewCounts: Record<number, number> = {};
  const sessionCounts: Record<number, number> = {};

  for (const uid of userIds) {
    const [{ rc }] = await db.select({ rc: sql<number>`count(*)` }).from(reviewsTable).where(eq(reviewsTable.userId, uid));
    reviewCounts[uid] = Number(rc);
    const [{ sc }] = await db.select({ sc: sql<number>`count(*)` }).from(sessionsTable).where(eq(sessionsTable.userId, uid));
    sessionCounts[uid] = Number(sc);
  }

  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl ?? null,
    isAdmin: u.isAdmin,
    reviewCount: reviewCounts[u.id] ?? 0,
    sessionCount: sessionCounts[u.id] ?? 0,
    createdAt: u.createdAt.toISOString(),
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
  if (parsed.data.isAdmin != null) updates.isAdmin = parsed.data.isAdmin;
  if (parsed.data.name != null) updates.name = parsed.data.name;
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const [{ rc }] = await db.select({ rc: sql<number>`count(*)` }).from(reviewsTable).where(eq(reviewsTable.userId, id));
  const [{ sc }] = await db.select({ sc: sql<number>`count(*)` }).from(sessionsTable).where(eq(sessionsTable.userId, id));
  res.json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl ?? null, isAdmin: user.isAdmin, reviewCount: Number(rc), sessionCount: Number(sc), createdAt: user.createdAt.toISOString() });
});

router.get("/admin/moderation", requireAuth, async (req, res): Promise<void> => {
  if (!await loadAdminUser(req, res)) return;
  const rows = await db
    .select({ review: reviewsTable, instructorName: instructorsTable.name, userName: usersTable.name, userAvatarUrl: usersTable.avatarUrl })
    .from(reviewsTable)
    .leftJoin(instructorsTable, eq(reviewsTable.instructorId, instructorsTable.id))
    .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.status, "pending"))
    .orderBy(reviewsTable.createdAt);

  res.json(rows.map(({ review, instructorName, userName, userAvatarUrl }) => ({
    id: review.id,
    userId: review.userId,
    userName: userName ?? null,
    userAvatarUrl: userAvatarUrl ?? null,
    instructorId: review.instructorId,
    instructorName: instructorName ?? null,
    sessionId: review.sessionId ?? null,
    value: review.value,
    effectiveness: review.effectiveness,
    punctuality: review.punctuality,
    overallScore: review.overallScore,
    comment: review.comment ?? null,
    status: review.status as "pending" | "approved" | "rejected",
    createdAt: review.createdAt.toISOString(),
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
    id: review.id, userId: review.userId, userName: null, userAvatarUrl: null,
    instructorId: review.instructorId, instructorName: null, sessionId: review.sessionId ?? null,
    value: review.value, effectiveness: review.effectiveness, punctuality: review.punctuality,
    overallScore: review.overallScore,
    comment: review.comment ?? null, status: review.status as "pending" | "approved" | "rejected",
    createdAt: review.createdAt.toISOString(),
  });
});

export default router;
