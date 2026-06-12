"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type Review = {
  id: string;
  student_id: string;
  instructor_id: string;
  rating_value: number;
  rating_effectiveness: number;
  rating_punctuality: number;
  comment: string | null;
  moderation_status: string;
  created_at: string;
  instructors: { full_name: string } | null;
  users: { full_name: string } | null;
};

export default function ModerationPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/moderation")
      .then((r) => r.json())
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  async function moderate(reviewId: string, status: "approved" | "rejected") {
    await fetch("/api/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, status }),
    });
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-rita-charcoal mb-6">
        Review Moderation
        {reviews.length > 0 && (
          <span className="ml-3 text-base font-semibold text-orange-500">
            ({reviews.length} pending)
          </span>
        )}
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-rita-gray bg-white rounded-2xl border border-slate-100">
          No reviews pending moderation 🎉
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const overall = (r.rating_value + r.rating_effectiveness + r.rating_punctuality) / 3;
            return (
              <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-rita-charcoal text-sm">
                        {r.users?.full_name ?? "Anonymous"}
                      </span>
                      <span className="text-rita-gray text-xs">→</span>
                      <span className="font-semibold text-rita-blue text-sm">
                        {r.instructors?.full_name ?? "Unknown instructor"}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 mb-2">
                      <span>Value: {r.rating_value}</span>
                      <span>Effectiveness: {r.rating_effectiveness}</span>
                      <span>Punctuality: {r.rating_punctuality}</span>
                      <span className="font-bold text-rita-charcoal">
                        Overall: {overall.toFixed(1)}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-rita-gray italic">&ldquo;{r.comment}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => moderate(r.id, "approved")}
                      className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => moderate(r.id, "rejected")}
                      className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
