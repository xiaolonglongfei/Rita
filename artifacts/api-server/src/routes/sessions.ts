import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { CreateSessionBody, VerifySessionBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

type SessionRow = {
  id: number;
  user_id: number;
  instructor_id: number;
  session_date: string;
  verified: boolean;
  verification_code: string | null;
  notes: string | null;
  created_at: string;
};

function formatSession(s: SessionRow, instructorName?: string | null) {
  return {
    id: s.id,
    userId: s.user_id,
    instructorId: s.instructor_id,
    instructorName: instructorName ?? null,
    sessionDate: s.session_date,
    verified: s.verified,
    notes: s.notes ?? null,
    createdAt: s.created_at,
  };
}

router.get("/sessions", requireAuth, async (req, res): Promise<void> => {
  const { data, error } = await supabase
    .from("sessions")
    .select("*, instructors(name)")
    .eq("user_id", req.session.userId!);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json((data as (SessionRow & { instructors: { name: string } | null })[])
    .map(s => formatSession(s, s.instructors?.name)));
});

router.post("/sessions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      user_id: req.session.userId!,
      instructor_id: parsed.data.instructorId,
      session_date: parsed.data.sessionDate,
      notes: parsed.data.notes ?? null,
    })
    .select("*, instructors(name)")
    .single();

  if (error || !session) { res.status(500).json({ error: "Failed to log session" }); return; }
  const s = session as SessionRow & { instructors: { name: string } | null };
  res.status(201).json(formatSession(s, s.instructors?.name));
});

router.get("/sessions/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data, error } = await supabase
    .from("sessions")
    .select("*, instructors(name)")
    .eq("id", id)
    .eq("user_id", req.session.userId!)
    .single();

  if (error || !data) { res.status(404).json({ error: "Session not found" }); return; }
  const s = data as SessionRow & { instructors: { name: string } | null };
  res.json(formatSession(s, s.instructors?.name));
});

router.post("/sessions/:id/verify", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = VerifySessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", req.session.userId!)
    .single();

  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  const s = session as SessionRow;

  if (s.verification_code && s.verification_code !== parsed.data.code) {
    res.status(400).json({ error: "Invalid verification code" }); return;
  }

  const { data: updated, error } = await supabase
    .from("sessions")
    .update({ verified: true })
    .eq("id", id)
    .select("*, instructors(name)")
    .single();

  if (error || !updated) { res.status(500).json({ error: "Failed to verify session" }); return; }
  const u = updated as SessionRow & { instructors: { name: string } | null };
  res.json(formatSession(u, u.instructors?.name));
});

export default router;
