import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "@workspace/db";
import { LoginBody, SignupBody, UpdateMeBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

type UserRow = {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  is_admin: boolean;
  password_hash: string;
  created_at: string;
};

function formatUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url ?? null,
    isAdmin: user.is_admin,
    createdAt: user.created_at,
  };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { email, password } = parsed.data;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !data) { res.status(401).json({ error: "Invalid email or password" }); return; }
  const user = data as UserRow;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }

  req.session.userId = user.id;
  res.json(formatUser(user));
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { email, password, name } = parsed.data;

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existing) { res.status(409).json({ error: "Email already in use" }); return; }

  const passwordHash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from("users")
    .insert({ email: email.toLowerCase(), password_hash: passwordHash, name })
    .select("*")
    .single();

  if (error || !data) { res.status(500).json({ error: "Failed to create user" }); return; }
  const user = data as UserRow;
  req.session.userId = user.id;
  res.status(201).json(formatUser(user));
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => { res.json({ ok: true }); });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", req.session.userId!)
    .single();

  if (error || !data) { res.status(401).json({ error: "User not found" }); return; }
  res.json(formatUser(data as UserRow));
});

router.patch("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.avatarUrl != null) updates.avatar_url = parsed.data.avatarUrl;

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", req.session.userId!)
    .select("*")
    .single();

  if (error || !data) { res.status(500).json({ error: "Failed to update user" }); return; }
  res.json(formatUser(data as UserRow));
});

export default router;
