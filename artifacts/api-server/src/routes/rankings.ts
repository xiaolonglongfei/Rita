import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

type InstructorRow = {
  id: number;
  name: string;
  photo_url: string | null;
  specialty: string;
  avg_score: number;
  review_count: number;
  verified: boolean;
};

type ReviewRow = {
  instructor_id: number;
  overall_score: number;
  status: string;
};

function formatRankingEntry(rank: number, i: InstructorRow) {
  return {
    rank,
    instructorId: i.id,
    instructorName: i.name,
    instructorPhotoUrl: i.photo_url ?? null,
    specialty: i.specialty,
    avgScore: i.avg_score,
    reviewCount: i.review_count,
    verified: i.verified,
  };
}

router.get("/rankings/public", async (req, res): Promise<void> => {
  const limitParam = req.query.limit;
  const limit = limitParam ? Math.min(Number(limitParam), 100) : 50;

  const { data, error } = await supabase
    .from("instructors")
    .select("id, name, photo_url, specialty, avg_score, review_count, verified")
    .gt("review_count", 0)
    .order("avg_score", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(limit);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json((data as InstructorRow[]).map((i, idx) => formatRankingEntry(idx + 1, i)));
});

router.get("/rankings/private", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [{ data: myReviews }, { data: allInstructors }] = await Promise.all([
    supabase.from("reviews").select("instructor_id, overall_score").eq("user_id", userId).eq("status", "approved"),
    supabase.from("instructors").select("id, name, photo_url, specialty, avg_score, review_count, verified").gt("review_count", 0),
  ]);

  const reviews = (myReviews ?? []) as ReviewRow[];
  const instructors = (allInstructors ?? []) as InstructorRow[];

  if (reviews.length === 0) {
    const sorted = [...instructors].sort((a, b) => b.avg_score - a.avg_score).slice(0, 50);
    res.json(sorted.map((i, idx) => formatRankingEntry(idx + 1, i)));
    return;
  }

  const reviewedIds = [...new Set(reviews.map(r => r.instructor_id))];
  const computeScore = (instructorId: number) => {
    const mine = reviews.filter(r => r.instructor_id === instructorId);
    if (!mine.length) return 0;
    return mine.reduce((sum, r) => sum + r.overall_score, 0) / mine.length;
  };

  const scored = instructors.map(i => {
    const myScore = computeScore(i.id);
    const hasMyReview = reviewedIds.includes(i.id);
    const blendedScore = hasMyReview ? myScore * 0.7 + i.avg_score * 0.3 : i.avg_score * 0.5;
    return { i, blendedScore, hasMyReview };
  });

  scored.sort((a, b) => {
    if (a.hasMyReview && !b.hasMyReview) return -1;
    if (!a.hasMyReview && b.hasMyReview) return 1;
    return b.blendedScore - a.blendedScore;
  });

  res.json(scored.slice(0, 50).map(({ i }, idx) => formatRankingEntry(idx + 1, i)));
});

export default router;
