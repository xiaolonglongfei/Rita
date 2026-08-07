"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  // "loading" → exchanging code; "ready" → show form; "success" → done; "error" → bad/expired link
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      return;
    }
    // Exchange the one-time code for a valid session so updateUser works
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error("Code exchange failed:", error.message);
        setStatus("error");
      } else {
        setStatus("ready");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      setStatus("success");
    }
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
          <p className="text-sm text-slate-500">Set a new password</p>
        </div>

        {status === "loading" && (
          <p className="text-center text-sm text-slate-400">Verifying your link…</p>
        )}

        {status === "error" && (
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ background: "#fee2e2" }}
            >
              ⚠️
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-2">
              This link is invalid or has expired
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Password reset links expire after a short time for security. Request
              a new one and try again.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block mt-6 text-sm font-bold py-3 px-6 rounded-xl text-white"
              style={{ background: "#f97316" }}
            >
              Request new link →
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ background: "#dcfce7" }}
            >
              ✅
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Password updated!
            </p>
            <p className="text-sm text-slate-500 mb-6">
              You can now log in with your new password.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: "#f97316" }}
            >
              Go to Login →
            </button>
          </div>
        )}

        {status === "ready" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Repeat your new password"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving || !password || !confirm}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 mt-1 transition-opacity"
              style={{ background: "#f97316" }}
            >
              {saving ? "Saving…" : "Set New Password →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
