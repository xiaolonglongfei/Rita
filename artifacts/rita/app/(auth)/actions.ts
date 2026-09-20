"use server";

import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/resend";
import { getGiveawayStatus } from "@/lib/giveaway";

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

export async function giveawaySignupAction(
  email: string,
  password: string,
  acceptedRules: boolean
) {
  if (getGiveawayStatus() !== "active") {
    return { error: "This promotion is not currently accepting entries." };
  }

  if (!acceptedRules) {
    return { error: "You must agree to the Official Rules & Terms to enter." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await getServerSupabase();
  const giveawayOptInAt = new Date().toISOString();
  const fullName = "Rovi Member";
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: fullName,
        giveaway_opt_in_at: giveawayOptInAt,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "We couldn't create your account. Please try again." };
  }

  if (data.user.identities?.length === 0) {
    return {
      error: "An account already exists for this email. Please sign in instead.",
    };
  }

  const service = createServiceClient();
  const { error: profileError } = await service.from("users").upsert({
    id: data.user.id,
    email: normalizedEmail,
    full_name: fullName,
    is_admin: false,
    giveaway_opt_in_at: giveawayOptInAt,
  });

  if (profileError) {
    return {
      error:
        "Your account was created, but we couldn't record your giveaway entry. Please contact support before trying again.",
    };
  }

  await sendWelcomeEmail({ to: normalizedEmail, fullName });

  return {
    entered: true,
    emailConfirmationRequired: !data.session,
  };
}
