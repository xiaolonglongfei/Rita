import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

type NotificationRow = {
  id: number;
  user_id: number;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
};

function formatNotification(n: NotificationRow) {
  return {
    id: n.id,
    userId: n.user_id,
    type: n.type,
    message: n.message,
    read: n.read,
    createdAt: n.created_at,
  };
}

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", req.session.userId!)
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json((data as NotificationRow[]).map(formatNotification));
});

router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", req.session.userId!)
    .select("*")
    .single();

  if (error || !data) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(formatNotification(data as NotificationRow));
});

router.patch("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", req.session.userId!);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

export default router;
