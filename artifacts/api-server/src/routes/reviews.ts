import { Router, type IRouter } from "express";
import { db, reviewsTable, instructorsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { CreateReviewBody, AdminModerateReviewBody, AdminModerateReviewParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { recomputeInstructorStats } from "./instructors";

const router: IRouter = Router();

function formatReview(review: typeof reviewsTable.$inferSelect, userName?: string | null, userAvatarUrl?: string | null, instructorName?: string | null) {
  return {
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
  };
}

router.get("/reviews", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select({ review: reviewsTable, instructorName: instructorsTable.name, userName: usersTable.name, userAvatarUrl: usersTable.avatarUrl })
    .from(reviewsTable)
    .leftJoin(instructorsTable, eq(reviewsTable.instructorId, instructorsTable.id))
    .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.userId, req.session.userId!))
    .orderBy(sql`${reviewsTable.createdAt} DESC`);

  res.json(rows.map(({ review, instructorName, userName, userAvatarUrl }) => formatReview(review, userName, userAvatarUrl, instructorName)));
});

router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { instructorId, sessionId, value, effectiveness, punctuality, comment } = parsed.data;
  const overallScore = (value + effectiveness + punctuality) / 3;

  const [review] = await db.insert(reviewsTable).values({
    userId: req.session.userId!,
    instructorId,
    sessionId: sessionId ?? null,
    value,
    effectiveness,
    punctuality,
    overallScore,
    comment: comment ?? null,
    status: "pending",
  }).returning();

  const [instructor] = await db.select().from(instructorsTable).where(eq(instructorsTable.id, instructorId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));

  await db.insert(notificationsTable).values({
    userId: req.session.userId!,
    type: "review_submitted",
    message: `Your review for ${instructor?.name ?? "instructor"} has been submitted and is awaiting moderation.`,
  });

  res.status(201).json(formatReview(review, user?.name, user?.avatarUrl, instructor?.name));
});

router.get("/reviews/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db
    .select({ review: reviewsTable, instructorName: instructorsTable.name, userName: usersTable.name, userAvatarUrl: usersTable.avatarUrl })
    .from(reviewsTable)
    .leftJoin(instructorsTable, eq(reviewsTable.instructorId, instructorsTable.id))
    .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.id, id));

  if (!row) { res.status(404).json({ error: "Review not found" }); return; }
  res.json(formatReview(row.review, row.userName, row.userAvatarUrl, row.instructorName));
});

export async function moderateReview(reviewId: number, status: "approved" | "rejected", moderationNote?: string) {
  const [review] = await db.update(reviewsTable).set({ status, moderationNote: moderationNote ?? null }).where(eq(reviewsTable.id, reviewId)).returning();
  if (review) {
    await recomputeInstructorStats(review.instructorId);
    if (status === "approved") {
      await db.insert(notificationsTable).values({
        userId: review.userId,
        type: "review_approved",
        message: `Your review has been approved and is now visible.`,
      });
    } else {
      await db.insert(notificationsTable).values({
        userId: review.userId,
        type: "review_rejected",
        message: `Your review was not approved${moderationNote ? `: ${moderationNote}` : "."}`,
      });
    }
  }
  return review;
}

export default router;
