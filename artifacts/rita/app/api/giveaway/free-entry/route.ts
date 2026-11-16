import { NextResponse } from "next/server";
import { isIP } from "node:net";
import { createServiceClient } from "@/lib/supabase/server";
import { GIVEAWAY_START_AT, GIVEAWAY_END_AT, getGiveawayStatus } from "@/lib/giveaway";
import { normalizeFreeEntryEmail, freeEntrySlotId, createFreeEntryIpLimiter } from "@/lib/giveaway-free-entry";

const FREE_ENTRY_PROMOTION_LIMIT = 3;
const FREE_ENTRY_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const IP_REQUEST_LIMIT = 5;
const IP_REQUEST_WINDOW_MS = 60 * 60 * 1000;
const consumeIp = createFreeEntryIpLimiter();

export const runtime = "nodejs";

function failure(error: string, status: number, retryAfter?: number) {
  return NextResponse.json({ error }, {
    status,
    headers: { "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) },
  });
}

export async function POST(request: Request) {
  const now = new Date();
  const forwardedIp = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const wait = consumeIp(isIP(forwardedIp) ? forwardedIp : "unknown", now.getTime(), IP_REQUEST_LIMIT, IP_REQUEST_WINDOW_MS);
  if (wait) return failure("Too many requests. Please try again in an hour.", 429, wait);
  const status = getGiveawayStatus(now);
  if (status !== "active") return failure(status === "upcoming"
    ? "The giveaway hasn't started yet. Please come back during the Promotion Period."
    : "This giveaway has ended. We’re no longer accepting entries.", 400);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return failure("Please check your name and email and try again.", 400);
  const name = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (name.length < 2 || name.length > 80) return failure("Please enter your full name using 2 to 80 characters.", 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) return failure("Please enter a valid email address.", 400);
  if (body.confirmed_18_plus !== true) return failure("Please confirm that you are 18 or older and have read the Official Rules.", 400);
  const emailKey = normalizeFreeEntryEmail(email);
  // Gmail normalization must still leave a usable local part.
  if (!emailKey.split("@")[0]) return failure("Please enter a valid email address.", 400);

  const db = createServiceClient();
  const { data: previous, count, error: lookupError } = await db.from("giveaway_free_entries")
    .select("created_at", { count: "exact" }).eq("email_key", emailKey)
    .gte("created_at", GIVEAWAY_START_AT.toISOString()).lt("created_at", GIVEAWAY_END_AT.toISOString())
    .order("created_at", { ascending: false }).limit(1);
  if (lookupError || count == null) return failure("We couldn't check your entry right now. Please try again shortly.", 503);
  if (count >= FREE_ENTRY_PROMOTION_LIMIT) return failure(`You've already used all ${FREE_ENTRY_PROMOTION_LIMIT} free entries for this promotion. Your recorded entries remain valid.`, 429);
  if (previous?.[0]) {
    const nextAt = new Date(previous[0].created_at).getTime() + FREE_ENTRY_INTERVAL_MS;
    if (!Number.isFinite(nextAt)) return failure("We couldn't check your entry right now. Please try again shortly.", 503);
    if (now.getTime() < nextAt) return failure("You can submit one free entry every 7 days. Please try again after your seven-day waiting period.", 429, Math.ceil((nextAt - now.getTime()) / 1000));
  }
  const { error } = await db.from("giveaway_free_entries").insert({
    id: freeEntrySlotId(emailKey, GIVEAWAY_START_AT.toISOString(), count + 1),
    full_name: name, email, email_key: emailKey, confirmed_18_plus: true,
    created_at: now.toISOString(),
  });
  if (error?.code === "23505") return failure("An entry for this email was just recorded. Please wait 7 days before entering again. Your recorded entries remain valid.", 429);
  if (error) return failure("We couldn't record your entry right now. Please try again shortly.", 503);
  return NextResponse.json({
    message: `Your entry is recorded. You have used ${count + 1} of ${FREE_ENTRY_PROMOTION_LIMIT} free entries for this promotion.`,
    free_entries_used: count + 1,
  }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
