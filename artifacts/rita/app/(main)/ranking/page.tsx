import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle2, MapPin } from "lucide-react";
import { scoreColor } from "@/lib/utils";

export default async function RankingPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("instructors")
    .select("id, full_name, avatar_url, teaching_locations, avg_overall, avg_value, avg_effectiveness, avg_punctuality, total_reviews, is_claimed")
    .gt("total_reviews", 0)
    .order("avg_overall", { ascending: false })
    .limit(50);

  const rankings = (data ?? []).map((i, idx) => ({ ...i, rank: idx + 1 }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-rita-charcoal mb-2">
          Public Rankings
        </h1>
        <p className="text-rita-gray">
          Instructors ranked by overall score from verified reviews.
        </p>
      </div>

      {rankings.length === 0 ? (
        <div className="text-center py-16 text-rita-gray">
          No rankings yet — be the first to submit a review.
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          {rankings.map((i, idx) => (
            <Link
              key={i.id}
              href={`/instructors/${i.id}`}
              className={`flex items-center gap-4 px-6 py-4 hover:bg-rita-gray-light transition-colors ${
                idx !== rankings.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${
                  i.rank === 1
                    ? "bg-yellow-100 text-yellow-700"
                    : i.rank === 2
                    ? "bg-slate-100 text-slate-600"
                    : i.rank === 3
                    ? "bg-orange-100 text-orange-600"
                    : "bg-rita-gray-light text-rita-gray"
                }`}
              >
                {i.rank}
              </div>
              <div className="w-10 h-10 rounded-xl bg-rita-blue-light flex items-center justify-center text-rita-blue font-bold flex-shrink-0">
                {i.full_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rita-charcoal text-sm">{i.full_name}</span>
                  {i.is_claimed && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-rita-blue flex-shrink-0" />
                  )}
                </div>
                {i.teaching_locations && (
                  <p className="text-xs text-rita-gray flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {i.teaching_locations}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div
                  className="text-lg font-extrabold"
                  style={{ color: scoreColor(i.avg_overall) }}
                >
                  {i.avg_overall.toFixed(1)}
                </div>
                <div className="text-xs text-slate-400">{i.total_reviews} reviews</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
