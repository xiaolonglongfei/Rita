export const GIVEAWAY_BONUS_ENTRY_CAP = 3;

export const GIVEAWAY_START_AT = new Date("2026-09-21T00:00:00-04:00");
export const GIVEAWAY_END_AT = new Date("2027-01-01T00:00:00-05:00");

export function getGiveawayStatus(now = new Date()) {
  if (now < GIVEAWAY_START_AT) return "upcoming" as const;
  if (now >= GIVEAWAY_END_AT) return "ended" as const;
  return "active" as const;
}