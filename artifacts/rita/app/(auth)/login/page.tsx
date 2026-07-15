"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "../actions";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/instructors";

  async function handleLogin() {
    setLoading(true);
    setError("");
    const result = await loginAction(email, password, next);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success loginAction calls redirect() server-side — no client code needed
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-rita-charcoal mb-1">
            Rovi<span className="text-rita-lime">.</span>
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
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
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
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 mt-2 transition-opacity"
            style={{ background: "#f97316" }}
          >
            {loading ? "Logging in…" : "Log In →"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold" style={{ color: "#f97316" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
