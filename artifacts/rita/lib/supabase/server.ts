import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1\/?$/, "");
}

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(getUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}

export function createServiceClient() {
  const key = process.env.SUPABASE_SVC_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(getUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
