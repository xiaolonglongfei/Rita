"use server";

import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/resend";

function getUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1\/?$/, "");
}

async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    getUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function loginAction(
  email: string,
  password: string,
  next: string = "/instructors"
) {
  const supabase = await getServerSupabase();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect(next);
}

export async function forgotPasswordAction(email: string) {
  const supabase = await getServerSupabase();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  // Call regardless of whether the email exists — never reveal registration status.
  // Supabase silently no-ops for unknown emails, so this is safe.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/reset-password`,
  });
  return { sent: true };
}

export async function signupAction(
  fullName: string,
  email: string,
  password: string
) {
  const supabase = await getServerSupabase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const service = createServiceClient();
    await service.from("users").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      is_admin: false,
    });
    await sendWelcomeEmail({ to: email, fullName });
  }

  if (!data.session) {
    return { emailSent: true, email };
  }

  redirect("/instructors?welcome=true");
}
