"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "../actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    // Always call the action — server never reveals whether email exists
    await forgotPasswordAction(email.trim());
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-8">
          <a
            href="/"
            className="font-bold text-2xl text-slate-800 hover:opacity-80 transition-opacity inline-block mb-1"
          >
            Rovi<span style={{ color: "#b8d400" }}>.</span>
          </a>
          <p className="text-sm text-slate-500">Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ background: "#fff7ed" }}
            >
              📧
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Check your inbox</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              If an account exists for{" "}
              <span className="font-medium text-slate-700">{email}</span>, a
              reset link has been sent. Check your spam folder if it doesn&apos;t
              arrive within a few minutes.
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 text-sm font-semibold"
              style={{ color: "#f97316" }}
            >
              ← Back to login
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-500 -mt-2 mb-1 text-center">
              Enter your email and we&apos;ll send you a reset link.
            </p>

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
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !email.trim()}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 mt-1 transition-opacity"
              style={{ background: "#f97316" }}
            >
              {loading ? "Sending…" : "Send Reset Link →"}
            </button>

            <p className="text-center text-xs text-slate-400">
              Remembered it?{" "}
              <Link href="/login" className="font-semibold" style={{ color: "#f97316" }}>
                Back to login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
