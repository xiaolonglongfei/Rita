import { Router, type IRouter } from "express";
import { db, sessionsTable, reviewsTable, notificationsTable, instructorsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [{ sessionCount }] = await db
    .select({ sessionCount: sql<number>`count(*)` })
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, userId));

  const [{ reviewCount }] = await db
    .select({ reviewCount: sql<number>`count(*)` })
    .from(reviewsTable)
    .where(eq(reviewsTable.userId, userId));

  const [{ unreadCount }] = await db
    .select({ unreadCount: sql<number>`count(*)` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));

  const topInstructorsRaw = await db
    .select()
    .from(instructorsTable)
    .where(sql`${instructorsTable.reviewCount} > 0`)
    .orderBy(desc(instructorsTable.avgScore))
    .limit(5);

  const topInstructors = topInstructorsRaw.map((instructor, i) => ({
    rank: i + 1,
    instructorId: instructor.id,
    instructorName: instructor.name,
    instructorPhotoUrl: instructor.photoUrl ?? null,
    specialty: instructor.specialty,
    avgScore: instructor.avgScore,
    reviewCount: instructor.reviewCount,
    verified: instructor.verified,
  }));

  const recentSessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, userId))
    .orderBy(desc(sessionsTable.createdAt))
    .limit(3);

  const recentReviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.userId, userId))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(3);

  const recentActivity = [
    ...recentSessions.map((s, i) => ({
      id: s.id * 100 + i,
      type: "session",
      message: `Logged a training session on ${s.sessionDate}`,
      createdAt: s.createdAt.toISOString(),
    })),
    ...recentReviews.map((r, i) => ({
      id: r.id * 100 + 50 + i,
      type: "review",
      message: `Submitted a review (score: ${r.overallScore.toFixed(1)})`,
      createdAt: r.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  res.json({
    totalSessions: Number(sessionCount),
    reviewsSubmitted: Number(reviewCount),
    unreadNotifications: Number(unreadCount),
    topInstructors,
    recentActivity,
  });
});

export default router;
