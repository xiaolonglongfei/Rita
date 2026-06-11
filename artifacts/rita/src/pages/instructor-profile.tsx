import { Layout } from "@/components/layout";
import { useGetInstructor, getGetInstructorQueryKey, useGetInstructorReviews, getGetInstructorReviewsQueryKey, useGetInstructorStats, getGetInstructorStatsQueryKey } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { ScoreTriangle } from "@/components/score-triangle";

function reviewBorderColor(score: number): string {
  if (score >= 4.0) return '#1668c8';
  if (score >= 2.5) return '#c89000';
  return '#c83030';
}

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

        {/* Header — no standalone score card */}
        <div className="flex items-start gap-6 border-b pb-8">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-3xl font-black text-muted-foreground shadow-sm flex-shrink-0 overflow-hidden">
            {instructor.photoUrl ? (
              <img src={instructor.photoUrl} alt={instructor.name} className="w-full h-full object-cover" />
            ) : (
              instructor.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
                {instructor.name}
              </h1>
              {instructor.claimed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  ✓ Claimed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
                  Unclaimed
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-muted-foreground mb-3">
              🎾 {instructor.specialty}
              {instructor.location && <span className="ml-3">📍 {instructor.location}</span>}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-2xl font-black" style={{ color: '#1668c8' }}>
                ⭐ {instructor.avgScore.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-muted-foreground">
                {instructor.reviewCount} reviews
              </span>
            </div>
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
              <h2 className="text-xl font-black tracking-tight uppercase text-muted-foreground">Recent Reviews</h2>
              <p className="text-xs text-muted-foreground">
                🔒 All reviews are anonymous. Reviewer identities are never disclosed.
              </p>
              <div className="space-y-4">
                {reviews?.items.map(review => (
                  <div
                    key={review.id}
                    className="rounded-xl p-6 bg-card shadow-sm"
                    style={{
                      borderLeft: `4px solid ${reviewBorderColor(review.overallScore)}`,
                      borderTop: '1px solid var(--color-border)',
                      borderRight: '1px solid var(--color-border)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-1 bg-accent/10 px-3 py-1 rounded-lg">
                        <span className="font-black text-lg text-accent">⭐ {review.overallScore.toFixed(1)}</span>
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
