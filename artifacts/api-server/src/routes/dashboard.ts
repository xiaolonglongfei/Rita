import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;

  const [
    { data: userSessions },
    { data: userReviews },
    { data: userNotifications },
    { data: topInstructorsRaw },
  ] = await Promise.all([
    supabase.from("sessions").select("id, session_date, created_at").eq("user_id", userId),
    supabase.from("reviews").select("id, overall_score, created_at").eq("user_id", userId),
    supabase.from("notifications").select("id").eq("user_id", userId).eq("read", false),
    supabase.from("instructors").select("id, name, photo_url, specialty, avg_score, review_count, verified").gt("review_count", 0).order("avg_score", { ascending: false }).limit(5),
  ]);

  type SessionRow = { id: number; session_date: string; created_at: string };
  type ReviewRow  = { id: number; overall_score: number; created_at: string };
  type InstructorRow = { id: number; name: string; photo_url: string | null; specialty: string; avg_score: number; review_count: number; verified: boolean };

  const sessions     = (userSessions ?? []) as SessionRow[];
  const reviews      = (userReviews ?? []) as ReviewRow[];
  const topInstructors = (topInstructorsRaw ?? []) as InstructorRow[];

  const recentActivity = [
    ...sessions.slice(0, 3).map((s, i) => ({
      id: s.id * 100 + i,
      type: "session",
      message: `Logged a training session on ${s.session_date}`,
      createdAt: s.created_at,
    })),
    ...reviews.slice(0, 3).map((r, i) => ({
      id: r.id * 100 + 50 + i,
      type: "review",
      message: `Submitted a review (score: ${r.overall_score.toFixed(1)})`,
      createdAt: r.created_at,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  res.json({
    totalSessions: sessions.length,
    reviewsSubmitted: reviews.length,
    unreadNotifications: (userNotifications ?? []).length,
    topInstructors: topInstructors.map((i, idx) => ({
      rank: idx + 1,
      instructorId: i.id,
      instructorName: i.name,
      instructorPhotoUrl: i.photo_url ?? null,
      specialty: i.specialty,
      avgScore: i.avg_score,
      reviewCount: i.review_count,
      verified: i.verified,
    })),
    recentActivity,
  });
});

export default router;
