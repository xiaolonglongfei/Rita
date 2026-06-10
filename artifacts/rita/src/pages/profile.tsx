import { Layout } from "@/components/layout";
import { useGetMe, useUpdateMe, useListMyReviews, useListSessions, getGetMeQueryKey } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Profile() {
  const { data: user } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  const [name, setName] = useState("");
  const updateMe = useUpdateMe();
  const queryClient = useQueryClient();

  const { data: reviews } = useListMyReviews();
  const { data: sessions } = useListSessions();

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (!user) return <Layout>Loading...</Layout>;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMe.mutate(
      { data: { name } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        
        <div className="border p-6 bg-card">
          <h2 className="text-xl font-bold mb-4">Account Settings</h2>
          <form onSubmit={handleUpdate} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-bold mb-2">Display Name</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded bg-background" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit"
              disabled={updateMe.isPending || name === user.name}
              className="bg-primary text-primary-foreground px-6 py-2 rounded font-bold hover:bg-primary/90 disabled:opacity-50 h-[42px]"
            >
              {updateMe.isPending ? "Saving..." : "Update"}
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Sessions</h2>
              <Link href="/sessions" className="text-accent hover:underline text-sm font-bold">View All</Link>
            </div>
            <div className="space-y-3">
              {sessions?.slice(0, 5).map(session => (
                <div key={session.id} className="border p-4 bg-card">
                  <div className="font-bold">{session.instructorName}</div>
                  <div className="text-sm text-muted-foreground">{new Date(session.sessionDate).toLocaleDateString()}</div>
                </div>
              ))}
              {sessions?.length === 0 && <div className="text-muted-foreground">No sessions yet.</div>}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">My Reviews</h2>
            </div>
            <div className="space-y-3">
              {reviews?.map(review => (
                <div key={review.id} className="border p-4 bg-card">
                  <div className="flex justify-between">
                    <div className="font-bold">{review.instructorName}</div>
                    <div className="font-bold text-accent">{review.overallScore.toFixed(1)}</div>
                  </div>
                  <div className="text-sm mt-2 text-muted-foreground flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${
                      review.status === 'approved' ? 'bg-green-100 text-green-800' :
                      review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {review.status}
                    </span>
                  </div>
                </div>
              ))}
              {reviews?.length === 0 && <div className="text-muted-foreground">No reviews yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
