import { Layout } from "@/components/layout";
import { useGetInstructor, getGetInstructorQueryKey, useGetInstructorReviews, getGetInstructorReviewsQueryKey, useGetInstructorStats, getGetInstructorStatsQueryKey } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { MapPin, ShieldCheck, Star } from "lucide-react";

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

  const radarData = stats ? [
    { subject: 'Technique', A: stats.avgTechnique, fullMark: 5 },
    { subject: 'Communication', A: stats.avgCommunication, fullMark: 5 },
    { subject: 'Patience', A: stats.avgPatience, fullMark: 5 },
    { subject: 'Adaptability', A: stats.avgAdaptability, fullMark: 5 },
    { subject: 'Expertise', A: stats.avgExpertise, fullMark: 5 },
  ] : [];

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
                {instructor.verified && (
                  <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded font-black tracking-wider uppercase">
                    <ShieldCheck size={14} /> Verified
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
              <div className="space-y-4">
                {reviews?.items.map(review => (
                  <div key={review.id} className="border p-6 rounded-xl bg-card shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {review.userName?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div className="font-bold">{review.userName || 'Anonymous'}</div>
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-accent/10 px-3 py-1 rounded-lg">
                        <Star size={16} className="fill-accent text-accent" />
                        <span className="font-black text-lg text-accent">{review.overallScore.toFixed(1)}</span>
                      </div>
                    </div>
                    {review.comment && <p className="text-muted-foreground leading-relaxed">{review.comment}</p>}
                    
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <span className="flex gap-1">Tech: <span className="text-foreground">{review.technique}</span></span>
                      <span className="flex gap-1">Comm: <span className="text-foreground">{review.communication}</span></span>
                      <span className="flex gap-1">Pat: <span className="text-foreground">{review.patience}</span></span>
                      <span className="flex gap-1">Adapt: <span className="text-foreground">{review.adaptability}</span></span>
                      <span className="flex gap-1">Exp: <span className="text-foreground">{review.expertise}</span></span>
                    </div>
                  </div>
                ))}
                {reviews?.items.length === 0 && (
                  <div className="p-8 text-center rounded-xl border border-dashed text-muted-foreground font-bold">No reviews yet. Be the first to review!</div>
                )}
              </div>
            </section>
          </div>

          <div>
            {stats && (
              <div className="sticky top-24 space-y-6">
                <div className="border rounded-xl bg-card shadow-sm p-6">
                  <h3 className="font-black text-center mb-6 tracking-tight">Score Breakdown</h3>
                  <div className="h-[250px] w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="var(--color-border)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10 }} />
                        <Radar name="Score" dataKey="A" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <StatBar label="Technique" score={stats.avgTechnique} />
                    <StatBar label="Communication" score={stats.avgCommunication} />
                    <StatBar label="Patience" score={stats.avgPatience} />
                    <StatBar label="Adaptability" score={stats.avgAdaptability} />
                    <StatBar label="Expertise" score={stats.avgExpertise} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatBar({ label, score }: { label: string, score: number }) {
  const percentage = (score / 5) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1">
        <span className="uppercase tracking-wider">{label}</span>
        <span className="text-accent">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-accent rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
