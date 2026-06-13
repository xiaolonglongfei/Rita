"use client";

import { useState } from "react";
import { VerticalSlider } from "./VerticalSlider";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  instructorId: string;
  instructorName: string;
}

function scoreColor(s: number): string {
  if (s >= 4.0) return "#f97316";
  if (s >= 2.5) return "#c89000";
  return "#c83030";
}

export function ReviewForm({ instructorId, instructorName }: ReviewFormProps) {
  const [value, setValue] = useState(5);
  const [effectiveness, setEffectiveness] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const overall = (value + effectiveness + punctuality) / 3;

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructor_id: instructorId,
          rating_value: value,
          rating_effectiveness: effectiveness,
          rating_punctuality: punctuality,
          comment: comment.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }
      router.push(`/instructors/${instructorId}?reviewed=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-md mx-auto shadow-sm">
      {/* Instructor name */}
      <div className="mb-6 pb-5 border-b border-slate-100 text-center">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Reviewing
        </p>
        <p className="text-lg font-bold text-slate-800">{instructorName}</p>
        <p className="text-xs text-slate-400 mt-1">
          🔒 Your review is completely anonymous
        </p>
      </div>

      {/* Vertical sliders */}
      <div className="flex justify-center gap-10 mb-6">
        <VerticalSlider label="Value" emoji="💰" value={value} onChange={setValue} />
        <VerticalSlider
          label="Effectiveness"
          emoji="📈"
          value={effectiveness}
          onChange={setEffectiveness}
        />
        <VerticalSlider
          label="Punctuality"
          emoji="⏰"
          value={punctuality}
          onChange={setPunctuality}
        />
      </div>

      {/* Overall score */}
      <div
        className="text-center rounded-xl py-3 mb-5"
        style={{ background: scoreColor(overall) + "15" }}
      >
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
          Overall Score
        </p>
        <p className="text-3xl font-bold" style={{ color: scoreColor(overall) }}>
          {overall.toFixed(1)}
        </p>
      </div>

      {/* Optional comment */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">
          Comment{" "}
          <span className="font-normal normal-case text-slate-400">(optional)</span>
        </label>
        <textarea
          className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-700 resize-none focus:outline-none focus:border-orange-300"
          rows={3}
          placeholder="Share your experience... (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
        />
        {comment.length > 0 && (
          <p className="text-xs text-slate-400 text-right mt-1">{comment.length}/500</p>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-500 mb-4 text-center">{error}</p>}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50 transition-opacity"
        style={{ background: "#f97316" }}
      >
        {submitting ? "Submitting..." : "Submit Anonymous Review"}
      </button>

      <p className="text-xs text-slate-400 text-center mt-3">
        🔒 Your identity is never revealed to the instructor
      </p>
    </div>
  );
}
