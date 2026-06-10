import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.session.userId!))
    .orderBy(notificationsTable.createdAt);
  res.json(notifications.map(formatNotification).reverse());
});

router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [notification] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.session.userId!)))
    .returning();

  if (!notification) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(formatNotification(notification));
});

router.patch("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, req.session.userId!));
  res.json({ ok: true });
});

export default router;
