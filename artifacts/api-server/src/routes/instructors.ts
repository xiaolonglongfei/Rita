import { Router, type IRouter } from "express";
import { db, instructorsTable, reviewsTable, usersTable } from "@workspace/db";
import { eq, ilike, or, and, gte, sql } from "drizzle-orm";
import { ListInstructorsQueryParams, AdminCreateInstructorBody, AdminUpdateInstructorBody, AdminUpdateInstructorParams, AdminDeleteInstructorParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

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

router.get("/instructors", async (req, res): Promise<void> => {
  const params = ListInstructorsQueryParams.safeParse(req.query);
  const search = params.success ? params.data.search : undefined;
  const specialty = params.success ? params.data.specialty : undefined;
  const location = params.success ? params.data.location : undefined;
  const minScore = params.success ? params.data.minScore : undefined;
  const page = params.success && params.data.page ? Number(params.data.page) : 1;
  const limit = params.success && params.data.limit ? Number(params.data.limit) : 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) conditions.push(or(ilike(instructorsTable.name, `%${search}%`), ilike(instructorsTable.bio, `%${search}%`)));
  if (specialty) conditions.push(ilike(instructorsTable.specialty, `%${specialty}%`));
  if (location) conditions.push(ilike(instructorsTable.location, `%${location}%`));
  if (minScore !== undefined) conditions.push(gte(instructorsTable.avgScore, Number(minScore)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(instructorsTable).where(where);
  const total = Number(countResult.count);

  const items = await db.select().from(instructorsTable).where(where).limit(limit).offset(offset);

  res.json({ items: items.map(formatInstructor), total, page, limit });
});

router.get("/instructors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [instructor] = await db.select().from(instructorsTable).where(eq(instructorsTable.id, id));
  if (!instructor) { res.status(404).json({ error: "Instructor not found" }); return; }

  res.json(formatInstructor(instructor));
});

router.get("/instructors/:id/reviews", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const instructorId = parseInt(raw, 10);
  if (isNaN(instructorId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db
    .select({
      review: reviewsTable,
      userName: usersTable.name,
      userAvatarUrl: usersTable.avatarUrl,
      instructorName: instructorsTable.name,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .leftJoin(instructorsTable, eq(reviewsTable.instructorId, instructorsTable.id))
    .where(and(eq(reviewsTable.instructorId, instructorId), eq(reviewsTable.status, "approved")))
    .orderBy(sql`${reviewsTable.createdAt} DESC`)
    .limit(50);

  const items = rows.map(({ review, userName, userAvatarUrl, instructorName }) => ({
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
  }));

  res.json({ items, total: items.length, page: 1, limit: 50 });
});

router.get("/instructors/:id/stats", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const instructorId = parseInt(raw, 10);
  if (isNaN(instructorId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [instructor] = await db.select().from(instructorsTable).where(eq(instructorsTable.id, instructorId));
  if (!instructor) { res.status(404).json({ error: "Instructor not found" }); return; }

  const reviews = await db.select().from(reviewsTable).where(and(eq(reviewsTable.instructorId, instructorId), eq(reviewsTable.status, "approved")));

  const scoreDistribution = [1, 2, 3, 4, 5].map(score => ({
    score,
    count: reviews.filter(r => Math.round(r.overallScore) === score).length,
  }));

  res.json({
    instructorId,
    avgValue: instructor.avgValue,
    avgEffectiveness: instructor.avgEffectiveness,
    avgPunctuality: instructor.avgPunctuality,
    avgScore: instructor.avgScore,
    reviewCount: instructor.reviewCount,
    scoreDistribution,
  });
});

export async function recomputeInstructorStats(instructorId: number) {
  const reviews = await db.select().from(reviewsTable).where(and(eq(reviewsTable.instructorId, instructorId), eq(reviewsTable.status, "approved")));
  if (reviews.length === 0) {
    await db.update(instructorsTable).set({ avgScore: 0, avgValue: 0, avgEffectiveness: 0, avgPunctuality: 0, reviewCount: 0 }).where(eq(instructorsTable.id, instructorId));
    return;
  }
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  await db.update(instructorsTable).set({
    reviewCount: reviews.length,
    avgValue: avg(reviews.map(r => r.value)),
    avgEffectiveness: avg(reviews.map(r => r.effectiveness)),
    avgPunctuality: avg(reviews.map(r => r.punctuality)),
    avgScore: avg(reviews.map(r => r.overallScore)),
  }).where(eq(instructorsTable.id, instructorId));
}

export default router;
