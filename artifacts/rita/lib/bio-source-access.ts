import "server-only";
import { createAnonymousClient, createClient } from "@/lib/supabase/server";

// App response allowlists cannot protect the underlying public Supabase API.
// Require column permission denial for both browser roles before saving sources.
export async function bioSourcePermissionsReady() {
  try {
    const clients = [createAnonymousClient(), await createClient()];
    const results = await Promise.all(clients.map((client) => client.from("instructors")
      .select("bio_source_url, bio_source_checked_at", { head: true }).limit(1)));
    return results.every((result) => result.error?.code === "42501");
  } catch {
    return false;
  }
}
