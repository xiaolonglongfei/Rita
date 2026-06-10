import { Layout } from "@/components/layout";
import { useGetPublicRankings, useGetPrivateRankings, useGetMe, getGetMeQueryKey, getGetPrivateRankingsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { Trophy, Target, ShieldCheck, Star } from "lucide-react";

export default function Rankings() {
  const { data: user } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  const [tab, setTab] = useState<"public" | "private">("public");
  
  const { data: publicRankings, isLoading: publicLoading } = useGetPublicRankings();
  const { data: privateRankings, isLoading: privateLoading } = useGetPrivateRankings({
    query: { enabled: tab === "private" && !!user, queryKey: getGetPrivateRankingsQueryKey() }
  });

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-primary">Leaderboards</h1>
            <p className="text-muted-foreground mt-2 font-medium">The definitive rankings of sports instructors, driven by real data.</p>
          </div>
        </div>
        
        <div className="flex p-1 bg-muted/50 rounded-xl max-w-md">
          <button 
            className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 font-black text-sm rounded-lg transition-all ${tab === "public" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab("public")}
          >
            <Trophy size={16} className={tab === "public" ? "text-accent" : ""} />
            GLOBAL TOP 100
          </button>
          {user && (
            <button 
              className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 font-black text-sm rounded-lg transition-all ${tab === "private" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setTab("private")}
            >
              <Target size={16} className={tab === "private" ? "text-accent" : ""} />
              MY BEST FIT
            </button>
          )}
        </div>

        <div>
          {tab === "public" && (
            publicLoading ? <LoadingState /> : (
              <RankingList rankings={publicRankings} />
            )
          )}
          {tab === "private" && (
            privateLoading ? <LoadingState /> : (
              <RankingList rankings={privateRankings} isPrivate />
            )
          )}
        </div>
      </div>
    </Layout>
  );
}

function LoadingState() {
  return <div className="py-20 text-center text-muted-foreground font-bold tracking-widest uppercase flex justify-center items-center gap-3"><Trophy className="animate-pulse" /> Compiling Standings...</div>;
}

function RankingList({ rankings, isPrivate = false }: { rankings?: any[], isPrivate?: boolean }) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed rounded-xl bg-card">
        <div className="text-muted-foreground font-bold tracking-widest uppercase">
          {isPrivate ? "Insufficient Data" : "No Rankings Available"}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {isPrivate ? "Log more sessions and reviews to generate your personalized coach fit model." : "Check back later."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-1 text-center">Rank</div>
        <div className="col-span-8 md:col-span-7">Instructor</div>
        <div className="col-span-3 md:col-span-2 text-right">Score</div>
        <div className="col-span-2 hidden md:block text-right">Reviews</div>
      </div>
      
      <div className="divide-y">
        {rankings.map((entry, index) => (
          <Link key={entry.instructorId} href={`/instructors/${entry.instructorId}`} className="block hover:bg-muted/30 transition-colors group">
            <div className="grid grid-cols-12 gap-4 p-4 items-center">
              <div className="col-span-1 text-center">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black ${index < 3 ? 'bg-accent/10 text-accent' : 'text-muted-foreground'}`}>
                  {index + 1}
                </span>
              </div>
              <div className="col-span-8 md:col-span-7">
                <div className="font-black text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                  {entry.instructorName}
                  {entry.verified && <ShieldCheck size={14} className="text-blue-600" />}
                </div>
                <div className="text-sm font-medium text-muted-foreground">{entry.specialty}</div>
              </div>
              <div className="col-span-3 md:col-span-2 text-right flex justify-end">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-black ${getScoreColor(entry.avgScore)}`}>
                  <Star size={14} className={entry.avgScore >= 4.0 ? "fill-blue-700" : entry.avgScore >= 2.5 ? "fill-amber-700" : "fill-red-700"} />
                  {entry.avgScore.toFixed(1)}
                </div>
              </div>
              <div className="col-span-2 hidden md:block text-right text-sm font-bold text-muted-foreground">
                {entry.reviewCount}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 4.0) return "bg-blue-50 text-blue-700 border-blue-200 border";
  if (score >= 2.5) return "bg-amber-50 text-amber-700 border-amber-200 border";
  return "bg-red-50 text-red-700 border-red-200 border";
}
