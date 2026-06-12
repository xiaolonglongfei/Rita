import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function AdminInstructorsPage() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("instructors")
    .select("*")
    .order("avg_score", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-rita-charcoal mb-6">Instructors</h1>
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        {(data ?? []).map((i, idx) => (
          <div
            key={i.id}
            className={`flex items-center gap-4 px-6 py-4 ${
              idx !== (data?.length ?? 0) - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-rita-blue-light flex items-center justify-center text-rita-blue font-bold flex-shrink-0">
              {i.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rita-charcoal text-sm">{i.name}</span>
                {i.verified && <CheckCircle2 className="h-3.5 w-3.5 text-rita-blue" />}
              </div>
              <p className="text-xs text-rita-gray">{i.specialty} · {i.location ?? "No location"}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold text-rita-blue">
                {i.review_count > 0 ? i.avg_score.toFixed(1) : "—"}
              </div>
              <div className="text-xs text-slate-400">{i.review_count} reviews</div>
            </div>
            <Link
              href={`/instructors/${i.id}`}
              className="text-xs text-rita-blue hover:underline flex-shrink-0"
            >
              View →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
