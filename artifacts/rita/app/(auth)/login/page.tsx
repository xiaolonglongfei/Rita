"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin() {
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/instructors");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-rita-charcoal mb-1">
            Rita<span className="text-rita-lime">.</span>
          </div>
          <p className="text-sm text-slate-500">Welcome back</p>
        </div>

        <div className="flex flex-col gap-4">
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
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="Your password"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rita-blue"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 mt-2 bg-rita-blue hover:bg-rita-blue-dark transition-colors"
          >
            {loading ? "Logging in…" : "Log In →"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-rita-blue font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
