import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MapPin, CheckCircle2, Star } from "lucide-react";
import { scoreColor, scoreLabel, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const [{ data: instructor }, { data: reviews }] = await Promise.all([
    supabase.from("instructors").select("*").eq("id", parseInt(id)).single(),
    supabase
      .from("reviews")
      .select("*, users(name)")
      .eq("instructor_id", parseInt(id))
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!instructor) notFound();

  const dims = [
    { label: "Value", score: instructor.avg_value },
    { label: "Effectiveness", score: instructor.avg_effectiveness },
    { label: "Punctuality", score: instructor.avg_punctuality },
  ];

  return (
    <div className="max-w-3xl">
      <Link href="/instructors" className="text-sm text-rita-blue mb-6 inline-block">
        ← Back to Instructors
      </Link>

      <div className="bg-white border border-slate-100 rounded-2xl p-8 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-rita-blue-light flex items-center justify-center text-rita-blue font-bold text-2xl flex-shrink-0">
            {instructor.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-rita-charcoal">{instructor.name}</h1>
              {instructor.verified && (
                <span className="inline-flex items-center gap-1 text-xs text-rita-blue bg-rita-blue-light px-2 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-sm text-rita-gray mb-1">{instructor.specialty}</p>
            {instructor.location && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {instructor.location}
              </p>
            )}
          </div>
          {instructor.review_count > 0 && (
            <div className="text-right">
              <div
                className="text-4xl font-extrabold"
                style={{ color: scoreColor(instructor.avg_score) }}
              >
                {instructor.avg_score.toFixed(1)}
              </div>
              <div className="text-xs text-slate-400">
                {scoreLabel(instructor.avg_score)} · {instructor.review_count} reviews
              </div>
            </div>
          )}
        </div>

        {instructor.bio && (
          <p className="text-sm text-rita-gray mt-5 leading-relaxed">{instructor.bio}</p>
        )}

        {instructor.review_count > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {dims.map((d) => (
              <div key={d.label} className="bg-rita-gray-light rounded-xl p-3 text-center">
                <div
                  className="text-xl font-extrabold"
                  style={{ color: scoreColor(d.score) }}
                >
                  {d.score.toFixed(1)}
                </div>
                <div className="text-xs text-rita-gray mt-0.5">{d.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5">
          <Link
            href={`/reviews/new?instructorId=${instructor.id}`}
            className="inline-block bg-rita-blue text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-rita-blue-dark transition-colors"
          >
            Write a Review
          </Link>
        </div>
      </div>

      {reviews && reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-rita-charcoal mb-4">Reviews</h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-rita-charcoal">
                    {(r.users as { name: string } | null)?.name ?? "Anonymous"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-rita-blue text-rita-blue" />
                    <span
                      className="font-bold text-sm"
                      style={{ color: scoreColor(r.overall_score) }}
                    >
                      {r.overall_score.toFixed(1)}
                    </span>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-rita-gray">{r.comment}</p>}
                <div className="mt-3 flex gap-4 text-xs text-slate-400">
                  <span>Value: {r.value.toFixed(1)}</span>
                  <span>Effectiveness: {r.effectiveness.toFixed(1)}</span>
                  <span>Punctuality: {r.punctuality.toFixed(1)}</span>
                  <span className="ml-auto">{formatDate(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
