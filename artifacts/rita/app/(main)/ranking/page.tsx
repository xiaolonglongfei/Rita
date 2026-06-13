import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { scoreColor } from "@/lib/utils";
import { InstructorBadge } from "@/components/instructor/InstructorBadge";

export default async function RankingPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("instructors")
    .select("id, full_name, teaching_locations, avg_overall, total_reviews, is_claimed")
    .order("avg_overall", { ascending: false, nullsFirst: false })
    .limit(50);

  const rankings = (data ?? []).map((i, idx) => ({ ...i, rank: idx + 1 }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-rita-charcoal mb-2">
          Westchester Tennis Rankings
        </h1>
        <p className="text-rita-gray">
          Platform rankings based on verified student reviews — updated regularly.
        </p>
      </div>

      <div className="mb-4">
        <span
          className="inline-block text-sm font-semibold px-4 py-2 rounded-full text-white"
          style={{ background: "#f97316" }}
        >
          Westchester Top Instructors
        </span>
      </div>

      {rankings.length === 0 ? (
        <div className="text-center py-16 text-rita-gray">
          No instructors yet — check back soon.
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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: "#f97316" }}
              >
                {i.full_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-rita-charcoal text-sm">{i.full_name}</span>
                  <InstructorBadge isClaimed={i.is_claimed} />
                </div>
                {i.teaching_locations && (
                  <p className="text-xs text-rita-gray flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {i.teaching_locations}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {(i.total_reviews ?? 0) > 0 && i.avg_overall != null ? (
                  <>
                    <div
                      className="text-lg font-extrabold"
                      style={{ color: scoreColor(i.avg_overall) }}
                    >
                      {i.avg_overall.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-400">{i.total_reviews} reviews</div>
                  </>
                ) : (
                  <div className="text-xs text-slate-300">No reviews yet</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
