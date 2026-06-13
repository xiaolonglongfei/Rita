import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ScoreTriangle } from "@/components/shared/ScoreTriangle";
import { ReviewCard } from "@/components/review/ReviewCard";
import { InstructorBadge } from "@/components/instructor/InstructorBadge";

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: instructor }, { data: reviews }, { count: verifiedSessions }] =
    await Promise.all([
      supabase.from("instructors").select("*").eq("id", id).single(),
      supabase
        .from("reviews")
        .select("id, rating_value, rating_effectiveness, rating_punctuality, comment, created_at, student_id")
        .eq("instructor_id", id)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", id)
        .not("verified_at", "is", null),
    ]);

  if (!instructor) notFound();

  const reviewsVisible = (instructor.total_reviews ?? 0) >= 3;

  const enrichedReviews = (reviews ?? []).map((r) => ({
    ...r,
    is_verified: true,
  }));

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-slate-100 -mx-6 -mt-6 px-6 py-6 mb-8">
        <div className="max-w-5xl mx-auto flex items-start gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ background: "#f97316" }}
          >
            {instructor.full_name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">{instructor.full_name}</h1>
              <InstructorBadge isClaimed={instructor.is_claimed} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span>🎾 Tennis</span>
              {instructor.teaching_locations && (
                <span>📍 {instructor.teaching_locations}</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="text-2xl font-bold" style={{ color: "#f97316" }}>
                ⭐ {(instructor.total_reviews ?? 0) > 0 ? instructor.avg_overall?.toFixed(1) : "—"}
              </span>
              <span className="text-sm text-slate-400">{instructor.total_reviews ?? 0} reviews</span>
              {(verifiedSessions ?? 0) > 0 && (
                <span className="text-sm text-slate-400">
                  ✓ {verifiedSessions} verified {verifiedSessions === 1 ? "session" : "sessions"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Page body — two-column grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: About + Reviews (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* About */}
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                About
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                {instructor.bio ?? "No bio available."}
              </p>
            </section>

            {/* Reviews */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Recent Reviews
                </h2>
                <a
                  href={`/reviews/new?instructor_id=${instructor.id}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                  style={{ background: "#f97316" }}
                >
                  Write a Review
                </a>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                🔒 All reviews are anonymous. Reviewer identities are never disclosed.
              </p>

              {reviewsVisible ? (
                <div className="flex flex-col gap-3">
                  {enrichedReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium">
                    Reviews pending — collecting feedback to protect reviewer privacy
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Reviews are shown once 3 or more have been collected
                  </p>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: Score Triangle (1/3 width, sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ScoreTriangle
                value={instructor.avg_value ?? 0}
                effectiveness={instructor.avg_effectiveness ?? 0}
                punctuality={instructor.avg_punctuality ?? 0}
                reviewCount={instructor.total_reviews ?? 0}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
