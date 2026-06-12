/**
 * Strips any path suffix and trailing slash from the Supabase URL.
 * Handles common copy-paste variants like:
 *   https://xyz.supabase.co/rest/v1
 *   https://xyz.supabase.co/rest/v1/
 *   https://xyz.supabase.co/
 * All normalise to: https://xyz.supabase.co
 */
export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    const { origin } = new URL(raw);
    return origin;
  } catch {
    return raw;
  }
}
