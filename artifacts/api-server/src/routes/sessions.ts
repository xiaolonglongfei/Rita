import { Router, type IRouter } from "express";
import { db, sessionsTable, instructorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateSessionBody, VerifySessionBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function formatSession(session: typeof sessionsTable.$inferSelect, instructorName?: string | null) {
  return {
    id: session.id,
    userId: session.userId,
    instructorId: session.instructorId,
    instructorName: instructorName ?? null,
    sessionDate: session.sessionDate,
    verified: session.verified,
    notes: session.notes ?? null,
    createdAt: session.createdAt.toISOString(),
  };
}

router.get("/sessions", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select({ session: sessionsTable, instructorName: instructorsTable.name })
    .from(sessionsTable)
    .leftJoin(instructorsTable, eq(sessionsTable.instructorId, instructorsTable.id))
    .where(eq(sessionsTable.userId, req.session.userId!));

  res.json(rows.map(({ session, instructorName }) => formatSession(session, instructorName)));
});

router.post("/sessions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db.insert(sessionsTable).values({
    userId: req.session.userId!,
    instructorId: parsed.data.instructorId,
    sessionDate: parsed.data.sessionDate,
    notes: parsed.data.notes ?? null,
  }).returning();

  const [instructor] = await db.select().from(instructorsTable).where(eq(instructorsTable.id, session.instructorId));
  res.status(201).json(formatSession(session, instructor?.name));
});

router.get("/sessions/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db
    .select({ session: sessionsTable, instructorName: instructorsTable.name })
    .from(sessionsTable)
    .leftJoin(instructorsTable, eq(sessionsTable.instructorId, instructorsTable.id))
    .where(and(eq(sessionsTable.id, id), eq(sessionsTable.userId, req.session.userId!)));

  if (!row) { res.status(404).json({ error: "Session not found" }); return; }
  res.json(formatSession(row.session, row.instructorName));
});

router.post("/sessions/:id/verify", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = VerifySessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(and(eq(sessionsTable.id, id), eq(sessionsTable.userId, req.session.userId!)));
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  if (session.verificationCode && session.verificationCode !== parsed.data.code) {
    res.status(400).json({ error: "Invalid verification code" });
    return;
  }

  const [updated] = await db.update(sessionsTable).set({ verified: true }).where(eq(sessionsTable.id, id)).returning();
  const [instructor] = await db.select().from(instructorsTable).where(eq(instructorsTable.id, updated.instructorId));
  res.json(formatSession(updated, instructor?.name));
});

export default router;
