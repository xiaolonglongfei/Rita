import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { getGiveawayReviewFilters } from "@/lib/giveaway";

/**
 * Qualifying = saved/Layer-1-accepted, still approved, created at/after opt-in,
 * within [promotion start, promotion end), and no later than the drawing/now.
 * Instructor verification is deliberately NOT required.
 * The draw SQL is generated from the same getGiveawayReviewFilters definition.
 */
export async function getGiveawayProgress(userId: string, now = new Date()) {
  const db = createServiceClient();
  const { data: profile, error: profileError } = await db
    .from("users")
    .select("giveaway_opt_in_at")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new Error("Unable to load giveaway consent.");
  if (!profile?.giveaway_opt_in_at) {
    return { optedIn: false, qualifyingReviewCount: 0, firstReview: null };
  }

  let query = db
    .from("reviews")
    .select("id, instructor_id", { count: "exact" })
    .eq("student_id", userId);
  for (const { column, operator, value } of getGiveawayReviewFilters(
    profile.giveaway_opt_in_at,
    now.toISOString()
  )) {
    query = query.filter(column, operator, value);
  }
  const { data, count, error } = await query
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1);
  if (error) throw new Error("Unable to load giveaway reviews.");
  return {
    optedIn: true,
    qualifyingReviewCount: count ?? 0,
    firstReview: data?.[0] ?? null,
  };
}
