"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
        <span className="text-sm font-bold text-rita-blue">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        step="0.5"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-rita-blue"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-0.5">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

function NewReviewForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [instructors, setInstructors] = useState<{ id: number; name: string }[]>([]);
  const [instructorId, setInstructorId] = useState(
    searchParams.get("instructorId") ?? ""
  );
  const [value, setValue] = useState(4);
  const [effectiveness, setEffectiveness] = useState(4);
  const [punctuality, setPunctuality] = useState(4);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/instructors?limit=100")
      .then((r) => r.json())
      .then((d) => setInstructors(d.items ?? []));
  }, []);

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instructorId: parseInt(instructorId),
        value,
        effectiveness,
        punctuality,
        comment: comment.trim() || null,
      }),
    });

    if (!res.ok) {
      setError("Failed to submit review. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/instructors/${instructorId}?reviewed=true`);
  }

  const overall = ((value + effectiveness + punctuality) / 3).toFixed(1);

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-extrabold text-rita-charcoal mb-2">Write a Review</h1>
      <p className="text-rita-gray mb-8">
        Your review is anonymous and will be verified before publishing.
      </p>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            Instructor
          </label>
          <select
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rita-blue"
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
          >
            <option value="">Select an instructor…</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <ScoreSlider label="Value for Money" value={value} onChange={setValue} />
        <ScoreSlider label="Teaching Effectiveness" value={effectiveness} onChange={setEffectiveness} />
        <ScoreSlider label="Punctuality" value={punctuality} onChange={setPunctuality} />

        <div className="bg-rita-blue-light rounded-xl p-4 text-center">
          <div className="text-3xl font-extrabold text-rita-blue">{overall}</div>
          <div className="text-xs text-rita-gray mt-0.5">Overall Score</div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
            Comment (optional)
          </label>
          <textarea
            placeholder="Share your experience…"
            rows={4}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rita-blue resize-none"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !instructorId}
          className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 bg-rita-blue hover:bg-rita-blue-dark transition-colors"
        >
          {loading ? "Submitting…" : "Submit Review →"}
        </button>
      </div>
    </div>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense>
      <NewReviewForm />
    </Suspense>
  );
}
