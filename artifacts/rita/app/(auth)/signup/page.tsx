"use client";

import { useState } from "react";
import { signupAction } from "../actions";
import Link from "next/link";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  async function handleSignUp() {
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const result = await signupAction(fullName, email, password);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result?.emailSent) {
      setSentTo(result.email ?? email);
      setEmailSent(true);
      setLoading(false);
      return;
    }

    // On success signupAction calls redirect() server-side — no client code needed
  }

  // US Open Fan Week bonus: show only through Aug 29, 2026 (inclusive).
  // Hardcoded cutoff — no config needed; just remove this block after the campaign.
  const showFanWeekBonus = new Date() < new Date("2026-08-30T00:00:00");
  const [fanWeekDismissed, setFanWeekDismissed] = useState(false);

  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 w-full max-w-md shadow-sm text-center">
          <a href="/" className="font-bold text-2xl text-slate-800 hover:opacity-80 transition-opacity inline-block mb-1">
            Rovi<span style={{ color: '#b8d400' }}>.</span>
          </a>
          <p className="text-4xl mt-6 mb-3">📬</p>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Check your email</h2>
          <p className="text-sm text-slate-500">
            We sent a confirmation link to <strong>{sentTo}</strong>. Click it
            to activate your account, then log in.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-sm font-semibold"
            style={{ color: "#f97316" }}
          >
            Back to Login →
          </Link>

          {/* US Open Fan Week bonus card — auto-hidden after Aug 29 2026 */}
          {showFanWeekBonus && !fanWeekDismissed && (
            <div className="mt-6 text-left rounded-xl border border-slate-200 bg-slate-50 p-4 relative">
              <button
                onClick={() => setFanWeekDismissed(true)}
                aria-label="Dismiss"
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                🎾 Bonus
              </p>
              <p className="text-sm font-bold text-slate-800 mb-1">
                Free US Open Fan Week access
              </p>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Adults need a free Fan Access Pass to attend Fan Week (Aug 23–29) at the
                USTA Billie Jean King National Tennis Center. Register directly with the
                US Open — takes about a minute.
              </p>
              <a
                href="https://fanpass.usopen.org/register"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-lg text-white text-xs font-bold"
                style={{ background: "#f97316" }}
              >
                Get my free pass →
              </a>
              <p className="text-xs text-slate-400 mt-3">
                Not affiliated with or endorsed by the USTA or US Open.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-8">
          <a href="/" className="font-bold text-2xl text-slate-800 hover:opacity-80 transition-opacity inline-block mb-1">
            Rovi<span style={{ color: '#b8d400' }}>.</span>
          </a>
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
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
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
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
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
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 mt-2 transition-opacity"
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
