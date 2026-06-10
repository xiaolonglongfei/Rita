import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody, SignupBody, UpdateMeBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  req.session.userId = user.id;
  res.json(formatUser(user));
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, name } = parsed.data;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
  }).returning();
  req.session.userId = user.id;
  res.status(201).json(formatUser(user));
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.patch("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.avatarUrl != null) updates.avatarUrl = parsed.data.avatarUrl;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.session.userId!)).returning();
  res.json(formatUser(user));
});

export default router;
