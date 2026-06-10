import { Router, type IRouter } from "express";
import { db, instructorsTable, reviewsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function formatRankingEntry(rank: number, instructor: typeof instructorsTable.$inferSelect) {
  return {
    rank,
    instructorId: instructor.id,
    instructorName: instructor.name,
    instructorPhotoUrl: instructor.photoUrl ?? null,
    specialty: instructor.specialty,
    avgScore: instructor.avgScore,
    reviewCount: instructor.reviewCount,
    verified: instructor.verified,
  };
}

router.get("/rankings/public", async (req, res): Promise<void> => {
  const limitParam = req.query.limit;
  const limit = limitParam ? Math.min(Number(limitParam), 100) : 50;

  const instructors = await db
    .select()
    .from(instructorsTable)
    .where(sql`${instructorsTable.reviewCount} > 0`)
    .orderBy(desc(instructorsTable.avgScore), desc(instructorsTable.reviewCount))
    .limit(limit);

  const entries = instructors.map((instructor, index) => formatRankingEntry(index + 1, instructor));
  res.json(entries);
});

router.get("/rankings/private", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const myReviews = await db
    .select()
    .from(reviewsTable)
    .where(and(eq(reviewsTable.userId, userId), eq(reviewsTable.status, "approved")));

  if (myReviews.length === 0) {
    const instructors = await db
      .select()
      .from(instructorsTable)
      .where(sql`${instructorsTable.reviewCount} > 0`)
      .orderBy(desc(instructorsTable.avgScore))
      .limit(50);
    res.json(instructors.map((instructor, i) => formatRankingEntry(i + 1, instructor)));
    return;
  }

  const reviewedInstructorIds = [...new Set(myReviews.map(r => r.instructorId))];

  const computeScore = (instructorId: number) => {
    const reviews = myReviews.filter(r => r.instructorId === instructorId);
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length;
  };

  const allInstructors = await db
    .select()
    .from(instructorsTable)
    .where(sql`${instructorsTable.reviewCount} > 0`);

  const scored = allInstructors.map(instructor => {
    const myScore = computeScore(instructor.id);
    const hasMyReview = reviewedInstructorIds.includes(instructor.id);
    const blendedScore = hasMyReview
      ? myScore * 0.7 + instructor.avgScore * 0.3
      : instructor.avgScore * 0.5;
    return { instructor, blendedScore, hasMyReview };
  });

  scored.sort((a, b) => {
    if (a.hasMyReview && !b.hasMyReview) return -1;
    if (!a.hasMyReview && b.hasMyReview) return 1;
    return b.blendedScore - a.blendedScore;
  });

  res.json(scored.slice(0, 50).map(({ instructor }, i) => formatRankingEntry(i + 1, instructor)));
});

export default router;
