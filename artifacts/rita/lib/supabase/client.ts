import { createBrowserClient } from "@supabase/ssr";

function getUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1\/?$/, "");
}

export function createClient() {
  return createBrowserClient(
    getUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
