import { Layout } from "@/components/layout";
import { useGetInstructor, getGetInstructorQueryKey, useGetInstructorReviews, getGetInstructorReviewsQueryKey, useGetInstructorStats, getGetInstructorStatsQueryKey } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { MapPin, Star } from "lucide-react";
import { ScoreTriangle } from "@/components/score-triangle";

export default function InstructorProfile() {
  const [match, params] = useRoute("/instructors/:id");
  const id = match ? parseInt(params.id) : 0;

  const { data: instructor, isLoading: instructorLoading } = useGetInstructor(id, {
    query: { enabled: !!id, queryKey: getGetInstructorQueryKey(id) }
  });

  const { data: stats } = useGetInstructorStats(id, {
    query: { enabled: !!id, queryKey: getGetInstructorStatsQueryKey(id) }
  });

  const { data: reviews } = useGetInstructorReviews(id, {
    query: { enabled: !!id, queryKey: getGetInstructorReviewsQueryKey(id) }
  });

  if (instructorLoading) {
    return <Layout><div className="flex justify-center items-center h-[50vh] text-muted-foreground font-bold tracking-widest uppercase">Loading Profile</div></Layout>;
  }

  if (!instructor) return <Layout><div className="text-center py-20 font-bold text-xl text-destructive">Instructor not found</div></Layout>;

  return (
    <Layout>
      <div className="space-y-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b pb-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center text-4xl font-black text-muted-foreground shadow-sm">
              {instructor.photoUrl ? (
                <img src={instructor.photoUrl} alt={instructor.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                instructor.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-3">
                {instructor.name}
                {instructor.claimed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    ✓ Claimed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
                    Unclaimed
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-lg font-medium text-muted-foreground">
                <span className="text-foreground font-bold">{instructor.specialty}</span>
                {instructor.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={18} /> {instructor.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right bg-card border rounded-xl p-4 min-w-[140px] shadow-sm">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
              <Star size={14} className="fill-accent text-accent" /> Score
            </div>
            <div className="text-6xl font-black tracking-tighter text-accent">{instructor.avgScore.toFixed(1)}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-2">{instructor.reviewCount} reviews</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-10">
            {instructor.bio && (
              <section className="space-y-3">
                <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground">About</h2>
                <p className="text-lg leading-relaxed">{instructor.bio}</p>
              </section>
            )}

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground">Recent Reviews</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                🔒 All reviews are anonymous. Reviewer identities are never disclosed.
              </p>
              <div className="space-y-4">
                {reviews?.items.map(review => (
                  <div key={review.id} className="border p-6 rounded-xl bg-card shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-1 bg-accent/10 px-3 py-1 rounded-lg">
                        <Star size={16} className="fill-accent text-accent" />
                        <span className="font-black text-lg text-accent">{review.overallScore.toFixed(1)}</span>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${review.sessionId ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {review.sessionId ? '✓ Verified Session' : 'Unverified'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                      <span className="flex gap-1">💰 Value: <span className="text-foreground">{review.value.toFixed(1)}</span></span>
                      <span className="flex gap-1">📈 Effectiveness: <span className="text-foreground">{review.effectiveness.toFixed(1)}</span></span>
                      <span className="flex gap-1">⏰ Punctuality: <span className="text-foreground">{review.punctuality.toFixed(1)}</span></span>
                    </div>

                    {review.comment && review.comment.trim() !== '' && (
                      <p className="text-muted-foreground leading-relaxed border-l-2 border-accent pl-3">{review.comment}</p>
                    )}
                  </div>
                ))}
                {reviews?.items.length === 0 && (
                  <div className="p-8 text-center rounded-xl border border-dashed text-muted-foreground font-bold">No reviews yet. Be the first to review!</div>
                )}
              </div>
            </section>
          </div>

          <div>
            <div className="sticky top-6">
              {stats ? (
                <ScoreTriangle
                  value={stats.avgValue}
                  effectiveness={stats.avgEffectiveness}
                  punctuality={stats.avgPunctuality}
                  reviewCount={stats.reviewCount}
                />
              ) : (
                <div className="border rounded-2xl bg-card shadow-sm p-6 text-center text-muted-foreground font-bold">
                  No stats yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
