export const GIVEAWAY_MAX_ENTRIES = 4;

export const GIVEAWAY_START_AT = new Date("2026-09-21T00:00:00-04:00");
export const GIVEAWAY_END_AT = new Date("2027-01-01T00:00:00-05:00");

export function getGiveawayStatus(now = new Date()) {
  if (now < GIVEAWAY_START_AT) return "upcoming" as const;
  if (now >= GIVEAWAY_END_AT) return "ended" as const;
  return "active" as const;
}

// Single qualification definition consumed by the server and draw-SQL generator.
// Saved reviews have passed Layer 1; instructor verification is not required.
export function getGiveawayReviewFilters(optInAt: string, cutoffAt: string) {
  return [
    { column: "moderation_status", operator: "eq", value: "approved" },
    { column: "created_at", operator: "gte", value: optInAt },
    { column: "created_at", operator: "gte", value: GIVEAWAY_START_AT.toISOString() },
    { column: "created_at", operator: "lt", value: GIVEAWAY_END_AT.toISOString() },
    { column: "created_at", operator: "lte", value: cutoffAt },
  ] as const;
}