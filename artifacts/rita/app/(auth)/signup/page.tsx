"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
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

    if (data.user) {
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        name: fullName,
        is_admin: false,
      });
    }

    router.push("/instructors?welcome=true");
    router.refresh();
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
            disabled={loading || !fullName || !email || !password}
            className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 mt-2 bg-rita-blue hover:bg-rita-blue-dark transition-colors"
          >
            {loading ? "Creating account…" : "Get Started →"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-rita-blue font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
