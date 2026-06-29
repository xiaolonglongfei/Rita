"use client";

import { useState } from "react";

interface Review {
  id: string;
  rating_value: number;
  rating_effectiveness: number;
  rating_punctuality: number;
  comment: string | null;
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

  async function handleAction(reviewId: string, action: "approve" | "remove") {
    setActing(reviewId);
    try {
      await fetch(`/api/moderation/${reviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
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

            <div className="flex gap-2">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
