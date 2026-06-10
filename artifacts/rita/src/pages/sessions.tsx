import { Layout } from "@/components/layout";
import { useListSessions } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function Sessions() {
  const { data: sessions, isLoading } = useListSessions();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">My Sessions</h1>
          <Link href="/sessions/new" className="bg-primary text-primary-foreground px-4 py-2 rounded font-bold hover:bg-primary/90">
            Log Session
          </Link>
        </div>

        {isLoading ? (
          <div>Loading sessions...</div>
        ) : (
          <div className="space-y-4">
            {sessions?.map(session => (
              <div key={session.id} className="border p-6 bg-card flex justify-between items-center">
                <div>
                  <div className="font-bold text-lg">{session.instructorName}</div>
                  <div className="text-muted-foreground">{new Date(session.sessionDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <Link href={`/reviews/new?sessionId=${session.id}&instructorId=${session.instructorId}`} className="text-accent hover:underline font-bold">
                    Review Session
                  </Link>
                </div>
              </div>
            ))}
            {sessions?.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">You haven't logged any sessions yet.</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
