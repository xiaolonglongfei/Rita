import { scoreColor, scoreBg } from "@/lib/utils";

type ReviewCardProps = {
  review: {
    id: string;
    rating_value: number;
    rating_effectiveness: number;
    rating_punctuality: number;
    comment: string | null;
    is_verified: boolean;
  };
};

export function ReviewCard({ review }: ReviewCardProps) {
  const overall =
    (review.rating_value + review.rating_effectiveness + review.rating_punctuality) / 3;

  return (
    <div
      className="bg-white rounded-xl p-4"
      style={{
        borderLeft: `4px solid ${scoreColor(overall)}`,
        borderTop: "1px solid #f1f5f9",
        borderRight: "1px solid #f1f5f9",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full"
          style={{ background: scoreBg(overall), color: scoreColor(overall) }}
        >
          ⭐ {overall.toFixed(1)}
        </span>
        {review.is_verified ? (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-700">
            ✓ Verified
          </span>
        ) : (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-400">
            Unverified
          </span>
        )}
      </div>

      <div className="flex gap-4 flex-wrap mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        <span>
          💰 Value:{" "}
          <strong className="text-slate-700">{review.rating_value.toFixed(1)}</strong>
        </span>
        <span>
          📈 Effectiveness:{" "}
          <strong className="text-slate-700">{review.rating_effectiveness.toFixed(1)}</strong>
        </span>
        <span>
          ⏰ Punctuality:{" "}
          <strong className="text-slate-700">{review.rating_punctuality.toFixed(1)}</strong>
        </span>
      </div>

      {review.comment && review.comment.trim() !== "" && (
        <p className="text-sm text-slate-600 leading-relaxed pl-3 border-l-2 border-slate-200">
          {review.comment}
        </p>
      )}
    </div>
  );
}
