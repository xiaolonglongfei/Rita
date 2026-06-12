"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { CalendarDays, CheckCircle2, MapPin } from "lucide-react";

type Session = {
  id: string;
  instructorId: string;
  instructorName: string | null;
  sessionDate: string;
  location: string | null;
  status: string;
  verified: boolean;
  createdAt: string;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [instructorId, setInstructorId] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
    });
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .finally(() => setLoading(false));
    fetch("/api/instructors?limit=100")
      .then((r) => r.json())
      .then((d) => setInstructors(d.items ?? []));
  }, [supabase, router]);

  async function handleLog() {
    setSubmitting(true);
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instructorId,
        sessionDate,
        location: sessionLocation || null,
      }),
    });
    const data = await fetch("/api/sessions").then((r) => r.json());
    setSessions(data);
    setShowForm(false);
    setInstructorId("");
    setSessionDate("");
    setSessionLocation("");
    setSubmitting(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-rita-charcoal mb-2">My Sessions</h1>
          <p className="text-rita-gray">Track your training history.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-rita-blue text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-rita-blue-dark transition-colors"
        >
          + Log Session
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-bold text-rita-charcoal">Log a Session</h2>
          <select
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rita-blue"
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
          >
            <option value="">Select instructor…</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
          <input
            type="date"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rita-blue"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
          <input
            type="text"
            placeholder="Location (optional)"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rita-blue"
            value={sessionLocation}
            onChange={(e) => setSessionLocation(e.target.value)}
          />
          <button
            onClick={handleLog}
            disabled={submitting || !instructorId || !sessionDate}
            className="bg-rita-blue text-white text-sm font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 hover:bg-rita-blue-dark transition-colors"
          >
            {submitting ? "Saving…" : "Save Session"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 text-rita-gray">
          No sessions logged yet. Click &ldquo;Log Session&rdquo; to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rita-blue-light flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-5 w-5 text-rita-blue" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-rita-charcoal text-sm">{s.instructorName ?? "Unknown"}</div>
                <div className="text-xs text-rita-gray">{formatDate(s.sessionDate)}</div>
                {s.location && (
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {s.location}
                  </div>
                )}
              </div>
              {s.verified ? (
                <CheckCircle2 className="h-5 w-5 text-rita-blue flex-shrink-0" />
              ) : (
                <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">{s.status}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
