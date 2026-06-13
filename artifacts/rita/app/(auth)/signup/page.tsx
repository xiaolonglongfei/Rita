"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  async function handleSignUp() {
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Insert user profile row regardless of confirmation state
    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        is_admin: false,
      });
    }

    if (data.session) {
      // Email confirmation disabled — session is live immediately
      // Full reload so middleware reads the fresh session cookie
      window.location.href = "/instructors?welcome=true";
    } else {
      // Supabase requires email confirmation
      setEmailSent(true);
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 w-full max-w-md shadow-sm text-center">
          <div className="text-3xl font-bold text-rita-charcoal mb-1">
            Rita<span className="text-rita-lime">.</span>
          </div>
          <p className="text-4xl mt-6 mb-3">📬</p>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Check your email</h2>
          <p className="text-sm text-slate-500">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-sm font-semibold"
            style={{ color: "#f97316" }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-rita-charcoal mb-1">
            Rita<span className="text-rita-lime">.</span>
          </div>
          <p className="text-sm text-slate-500">Create an account to start reviewing</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Your full name"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rita-blue"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rita-blue"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rita-blue"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 mt-2 transition-colors"
            style={{ background: "#f97316" }}
          >
            {loading ? "Creating account…" : "Get Started →"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "#f97316" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
