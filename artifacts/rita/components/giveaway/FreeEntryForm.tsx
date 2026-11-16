"use client";

import Link from "next/link";
import { useState } from "react";

export function FreeEntryForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || success) return;
    setError("");
    if (fullName.trim().length < 2 || fullName.trim().length > 80 || !confirmed) {
      setError("Please enter your full name and confirm that you are 18 or older and have read the Official Rules.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/giveaway/free-entry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), email: email.trim(), confirmed_18_plus: confirmed }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.message) throw new Error(body?.error || "We couldn't record your entry. Please try again.");
      setSuccess(body.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't record your entry. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (success) return <p role="status" className="mt-6 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-800">{success}</p>;
  return (
    <form onSubmit={submit} className="mt-6 space-y-5">
      <label className="block text-sm font-semibold text-slate-700">
        Full name
        <input type="text" name="full_name" autoComplete="name" required minLength={2} maxLength={80}
          value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={busy}
          className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Email
        <input type="email" name="email" autoComplete="email" required maxLength={254}
          value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy}
          className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
      </label>
      <label className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
        <input type="checkbox" required checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}
          disabled={busy} className="mt-1 accent-orange-600" />
        <span>I am 18 or older and I have read the <Link href="/rules" className="text-orange-600 underline underline-offset-2">Official Rules</Link>.</span>
      </label>
      <p className="text-xs leading-relaxed text-slate-500">Your name and email are used only to administer the giveaway, not for marketing.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy || !confirmed}
        className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? "Recording entry…" : "Record free entry"}
      </button>
    </form>
  );
}
