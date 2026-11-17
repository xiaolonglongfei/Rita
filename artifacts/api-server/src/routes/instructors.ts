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
  reviews_visible?: boolean;
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
  is_verified: boolean;
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
    avgScore: i.reviews_visible === true ? i.avg_score : null,
    avgValue: i.reviews_visible === true ? i.avg_value : null,
    avgEffectiveness: i.reviews_visible === true ? i.avg_effectiveness : null,
    avgPunctuality: i.reviews_visible === true ? i.avg_punctuality : null,
    reviewCount: i.review_count,
    publicRank: i.reviews_visible === true ? i.public_rank ?? null : null,
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

  let query = supabase.from("instructors").select("id, name, bio, specialty, photo_url, location, verified, avg_score, avg_value, avg_effectiveness, avg_punctuality, review_count, public_rank, created_at, reviews_visible", { count: "exact" }).is("opted_out_at", null)
    .eq("is_active", true).eq("is_test", false);

  if (search) query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%`);
  if (specialty) query = query.ilike("specialty", `%${specialty}%`);
  if (location)  query = query.ilike("location",  `%${location}%`);
  if (minScore !== undefined) query = query.eq("reviews_visible", true).gte("avg_score", Number(minScore));

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ items: (data as InstructorRow[]).map(formatInstructor), total: count ?? 0, page, limit });
});

router.get("/instructors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(404).json({ error: "Instructor not found" }); return; }

  const { data, error } = await supabase.from("instructors")
    .select("id, name, bio, specialty, photo_url, location, verified, avg_score, avg_value, avg_effectiveness, avg_punctuality, review_count, public_rank, created_at, reviews_visible")
    .eq("id", id).is("opted_out_at", null).eq("is_active", true).eq("is_test", false).single();
  if (error || !data) { res.status(404).json({ error: "Instructor not found" }); return; }
  res.json(formatInstructor(data as InstructorRow));
});

router.get("/instructors/:id/reviews", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const instructorId = parseInt(raw, 10);
  if (isNaN(instructorId)) { res.status(404).json({ error: "Instructor not found" }); return; }

  const { data: visibleInstructor } = await supabase.from("instructors").select("id, reviews_visible")
    .eq("id", instructorId).is("opted_out_at", null).eq("is_active", true).eq("is_test", false).maybeSingle();
  if (!visibleInstructor) { res.status(404).json({ error: "Instructor not found" }); return; }
  if (visibleInstructor.reviews_visible !== true) {
    res.json({ items: [], total: 0, page: 1, limit: 50 });
    return;
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("id, value, effectiveness, punctuality, comment, created_at, is_verified")
    .eq("instructor_id", instructorId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const items = ((data ?? []) as ReviewRow[])
    .map(r => ({
      id: r.id,
      rating_value: r.value,
      rating_effectiveness: r.effectiveness,
      rating_punctuality: r.punctuality,
      comment: r.comment ?? null,
      created_at: r.created_at,
      is_verified: r.is_verified,
    }));

  res.json({ items, total: items.length, page: 1, limit: 50 });
});

router.get("/instructors/:id/stats", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const instructorId = parseInt(raw, 10);
  if (isNaN(instructorId)) { res.status(404).json({ error: "Instructor not found" }); return; }

  const { data: instructor, error: ie } = await supabase.from("instructors")
    .select("id, avg_value, avg_effectiveness, avg_punctuality, avg_score, review_count, reviews_visible")
    .eq("id", instructorId).is("opted_out_at", null).eq("is_active", true).eq("is_test", false).single();
  if (ie || !instructor) { res.status(404).json({ error: "Instructor not found" }); return; }
  if (instructor.reviews_visible !== true) {
    res.json({
      instructorId, avgValue: null, avgEffectiveness: null, avgPunctuality: null,
      avgScore: null, reviewCount: instructor.review_count, scoreDistribution: [],
    });
    return;
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("overall_score")
    .eq("instructor_id", instructorId)
    .eq("status", "approved");

  const i = instructor;
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
