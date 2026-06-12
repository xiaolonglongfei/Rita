import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { ListInstructorsQueryParams } from "@workspace/api-zod";

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

function formatInstructor(i: InstructorRow) {
  return {
    id: i.id,
    name: i.name,
    bio: i.bio ?? null,
    specialty: i.specialty,
    photoUrl: i.photo_url ?? null,
    location: i.location ?? null,
    claimed: i.verified,
    avgScore: i.avg_score,
    avgValue: i.avg_value,
    avgEffectiveness: i.avg_effectiveness,
    avgPunctuality: i.avg_punctuality,
    reviewCount: i.review_count,
    publicRank: i.public_rank ?? null,
    createdAt: i.created_at,
  };
}

router.get("/instructors", async (req, res): Promise<void> => {
  const params = ListInstructorsQueryParams.safeParse(req.query);
  const search    = params.success ? params.data.search    : undefined;
  const specialty = params.success ? params.data.specialty : undefined;
  const location  = params.success ? params.data.location  : undefined;
  const minScore  = params.success ? params.data.minScore  : undefined;
  const page  = params.success && params.data.page  ? Number(params.data.page)  : 1;
  const limit = params.success && params.data.limit ? Number(params.data.limit) : 20;
  const offset = (page - 1) * limit;

  let query = supabase.from("instructors").select("*", { count: "exact" });

  if (search) query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%`);
  if (specialty) query = query.ilike("specialty", `%${specialty}%`);
  if (location)  query = query.ilike("location",  `%${location}%`);
  if (minScore !== undefined) query = query.gte("avg_score", Number(minScore));

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ items: (data as InstructorRow[]).map(formatInstructor), total: count ?? 0, page, limit });
});

router.get("/instructors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data, error } = await supabase.from("instructors").select("*").eq("id", id).single();
  if (error || !data) { res.status(404).json({ error: "Instructor not found" }); return; }
  res.json(formatInstructor(data as InstructorRow));
});

router.get("/instructors/:id/reviews", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const instructorId = parseInt(raw, 10);
  if (isNaN(instructorId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data, error } = await supabase
    .from("reviews")
    .select("*, users(name, avatar_url), instructors(name)")
    .eq("instructor_id", instructorId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const items = (data as (ReviewRow & { users: { name: string; avatar_url: string | null } | null; instructors: { name: string } | null })[])
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
    }));

  res.json({ items, total: items.length, page: 1, limit: 50 });
});

router.get("/instructors/:id/stats", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const instructorId = parseInt(raw, 10);
  if (isNaN(instructorId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data: instructor, error: ie } = await supabase.from("instructors").select("*").eq("id", instructorId).single();
  if (ie || !instructor) { res.status(404).json({ error: "Instructor not found" }); return; }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("overall_score")
    .eq("instructor_id", instructorId)
    .eq("status", "approved");

  const i = instructor as InstructorRow;
  const scoreDistribution = [1, 2, 3, 4, 5].map(score => ({
    score,
    count: (reviews ?? []).filter((r: { overall_score: number }) => Math.round(r.overall_score) === score).length,
  }));

  res.json({
    instructorId,
    avgValue: i.avg_value,
    avgEffectiveness: i.avg_effectiveness,
    avgPunctuality: i.avg_punctuality,
    avgScore: i.avg_score,
    reviewCount: i.review_count,
    scoreDistribution,
  });
});

export async function recomputeInstructorStats(instructorId: number) {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("value, effectiveness, punctuality, overall_score")
    .eq("instructor_id", instructorId)
    .eq("status", "approved");

  const rows = (reviews ?? []) as { value: number; effectiveness: number; punctuality: number; overall_score: number }[];

  if (rows.length === 0) {
    await supabase.from("instructors").update({ avg_score: 0, avg_value: 0, avg_effectiveness: 0, avg_punctuality: 0, review_count: 0 }).eq("id", instructorId);
    return;
  }
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  await supabase.from("instructors").update({
    review_count: rows.length,
    avg_value: avg(rows.map(r => r.value)),
    avg_effectiveness: avg(rows.map(r => r.effectiveness)),
    avg_punctuality: avg(rows.map(r => r.punctuality)),
    avg_score: avg(rows.map(r => r.overall_score)),
  }).eq("id", instructorId);
}

export default router;
