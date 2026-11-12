export const CLUB_SOURCE_KEY = "rovi_club";

export function rememberClubSource(slug: string) {
  try {
    window.sessionStorage.setItem(CLUB_SOURCE_KEY, slug);
  } catch {
    // Referral tracking must not prevent viewing or signing up when storage is blocked.
  }
}

export function getGiveawayClubSource(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const fromUrl = new URLSearchParams(window.location.search).get("club");
  if (fromUrl) return fromUrl;
  try {
    return window.sessionStorage.getItem(CLUB_SOURCE_KEY) || undefined;
  } catch {
    return undefined;
  }
}
