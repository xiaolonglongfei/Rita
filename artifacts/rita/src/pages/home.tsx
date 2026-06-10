import { Layout } from "@/components/layout";
import { useGetMe, useGetDashboardStats, getGetMeQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Star, Calendar, MessageSquare, Bell } from "lucide-react";

export default function Home() {
  const { data: user, isLoading: userLoading } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  
  if (userLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh] text-muted-foreground font-bold tracking-widest uppercase">Loading</div>
      </Layout>
    );
  }

  if (user) {
    return <Dashboard user={user} />;
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-32 text-center max-w-4xl mx-auto space-y-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-bold text-sm mb-4">
          <Star size={14} className="fill-accent" /> Now tracking top coaches
        </div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[1.1] text-primary">
          Data-driven instructor <span className="text-accent underline decoration-8 underline-offset-8">rankings</span>.
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed font-medium">
          Rita is where serious athletes go to find and vet instructors they can trust. 
          Stop guessing. Start training with the best.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-8 w-full sm:w-auto">
          <Link href="/signup" className="flex items-center justify-center gap-2 bg-accent text-accent-foreground px-8 py-4 text-lg font-black rounded-lg hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/20">
            Create Account <ArrowRight size={20} />
          </Link>
          <Link href="/instructors" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-lg font-black rounded-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95">
            Browse Instructors
          </Link>
        </div>
      </div>
    </Layout>
  );
}

function Dashboard({ user }: { user: any }) {
  const { data: stats } = useGetDashboardStats();

  return (
    <Layout>
      <div className="space-y-10">
        <header>
          <h1 className="text-4xl font-black tracking-tighter">Welcome back, {user.name}</h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Here's your training dashboard.</p>
        </header>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-border/50 p-6 bg-card rounded-xl shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-muted/20 group-hover:text-muted/40 transition-colors">
                  <Calendar size={120} />
                </div>
                <div className="relative">
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Sessions</div>
                  <div className="text-5xl font-black mt-2 tracking-tighter">{stats.totalSessions}</div>
                </div>
              </div>
              <div className="border border-border/50 p-6 bg-card rounded-xl shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-muted/20 group-hover:text-muted/40 transition-colors">
                  <MessageSquare size={120} />
                </div>
                <div className="relative">
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Reviews Given</div>
                  <div className="text-5xl font-black mt-2 tracking-tighter">{stats.reviewsSubmitted}</div>
                </div>
              </div>
              <div className="border border-border/50 p-6 bg-card rounded-xl shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-accent/5 group-hover:text-accent/10 transition-colors">
                  <Bell size={120} />
                </div>
                <div className="relative">
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Unread Alerts</div>
                  <div className="text-5xl font-black mt-2 tracking-tighter text-accent">{stats.unreadNotifications}</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <div className="p-5 border-b bg-muted/30">
                  <h2 className="text-lg font-black tracking-tight">Top Ranked Instructors</h2>
                </div>
                <div className="divide-y">
                  {stats.topInstructors?.map((instructor: any, index: number) => (
                    <Link key={instructor.instructorId} href={`/instructors/${instructor.instructorId}`} className="flex items-center p-4 hover:bg-muted/50 transition-colors">
                      <div className="w-8 font-black text-muted-foreground text-lg">{index + 1}</div>
                      <div className="flex-1">
                        <div className="font-bold flex items-center gap-2">
                          {instructor.instructorName}
                          {instructor.verified && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-black tracking-wider">VERIFIED</span>}
                        </div>
                        <div className="text-sm text-muted-foreground">{instructor.specialty}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-lg text-accent">{instructor.avgScore.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground font-bold">{instructor.reviewCount} revs</div>
                      </div>
                    </Link>
                  ))}
                  {(!stats.topInstructors || stats.topInstructors.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground font-medium">No instructors ranked yet.</div>
                  )}
                </div>
              </div>

              <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <div className="p-5 border-b bg-muted/30">
                  <h2 className="text-lg font-black tracking-tight">Recent Activity</h2>
                </div>
                <div className="divide-y">
                  {stats.recentActivity?.map((activity: any) => (
                    <div key={activity.id} className="p-4 flex gap-4">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-relaxed">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-bold">{new Date(activity.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground font-medium">No recent activity.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
