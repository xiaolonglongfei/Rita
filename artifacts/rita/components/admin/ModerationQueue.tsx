"use client";

import { useState } from "react";

interface Review {
  id: string;
  rating_value: number;
  rating_effectiveness: number;
  rating_punctuality: number;
  comment: string | null;
  moderation_note?: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  moderation_status: string;
  session_date: string | null;
  users: { full_name: string; email: string } | null;
  instructors: { full_name: string } | null;
}

export function ModerationQueue({ reviews: initialReviews }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [acting, setActing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAction(reviewId: string, action: "approve" | "remove" | "comment_removed") {
    setActing(reviewId);
    setError(null);
    setSuccess(null);
    try {
      const review = reviews.find((r) => r.id === reviewId);
      const response = await fetch(`/api/moderation/${reviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, moderationNote: notes[reviewId] ?? review?.moderation_note ?? "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Moderation action failed. Please try again.");
      if (action === "comment_removed") {
        setReviews((prev) => prev.map((r) => r.id === reviewId
          ? { ...r, comment: null, moderation_note: result.moderationNote } : r));
        setSuccess("Comment removed. Ratings and moderation status are unchanged.");
      } else {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Moderation action failed. Please try again.");
    } finally {
      setActing(null);
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-sm text-slate-400">No reviews need moderation right now.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{success}</p>}
      {reviews.map((review) => {
        const overall =
          (review.rating_value + review.rating_effectiveness + review.rating_punctuality) / 3;
        const isActing = acting === review.id;
        return (
          <div key={review.id} className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Review for {review.instructors?.full_name ?? "Unknown"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  By: {review.users?.full_name ?? "Unknown"}{" "}
                  {review.users?.email && `(${review.users.email})`}
                </p>
                {review.session_date && (
                  <p className="text-xs text-slate-400">
                    📅 {new Date(review.session_date).toLocaleDateString()}
                  </p>
                )}
                {review.flag_reason && (
                  <p className="text-xs text-red-500 mt-1">⚠️ {review.flag_reason}</p>
                )}
                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                  <span>V {review.rating_value}</span>
                  <span>E {review.rating_effectiveness}</span>
                  <span>P {review.rating_punctuality}</span>
                </div>
              </div>
              <span className="text-lg font-bold flex-shrink-0" style={{ color: "#f97316" }}>
                ⭐ {overall.toFixed(1)}
              </span>
            </div>

            {review.comment && (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mb-3 italic">
                &ldquo;{review.comment}&rdquo;
              </p>
            )}

            <label htmlFor={`moderation-note-${review.id}`} className="mb-1 block text-xs font-semibold text-slate-600">
              Internal note (optional)
            </label>
            <input
              id={`moderation-note-${review.id}`}
              value={notes[review.id] ?? review.moderation_note ?? ""}
              onChange={(event) => setNotes((prev) => ({ ...prev, [review.id]: event.target.value }))}
              disabled={isActing}
              maxLength={500}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAction(review.id, "approve")}
                disabled={isActing}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "#22c55e" }}
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleAction(review.id, "remove")}
                disabled={isActing}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "#ef4444" }}
              >
                ✗ Remove
              </button>
              <button
                onClick={() => handleAction(review.id, "comment_removed")}
                disabled={isActing || !review.comment}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold disabled:opacity-50"
              >
                Remove comment only
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
