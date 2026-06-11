import { Layout } from "@/components/layout";
import { useCreateReview, useListInstructors, useGetMe, getGetInstructorReviewsQueryKey, getListMyReviewsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation, useSearch, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { VerticalSlider } from "@/components/vertical-slider";

function scoreColor(s: number): string {
  if (s >= 4.0) return '#1668c8'
  if (s >= 2.5) return '#c89000'
  return '#c83030'
}

export default function NewReview() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialInstructorId = params.get("instructorId") || "";
  const initialSessionId = params.get("sessionId") || "";

  const [instructorId, setInstructorId] = useState(initialInstructorId);
  const [value, setValue] = useState(5);
  const [effectiveness, setEffectiveness] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [comment, setComment] = useState("");

  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createReview = useCreateReview();
  const { data: user, isLoading: userLoading } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  const { data: instructors } = useListInstructors({ limit: 100 });

  const overall = (value + effectiveness + punctuality) / 3;
  const selectedInstructor = instructors?.items.find(i => String(i.id) === instructorId);

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/login");
    }
  }, [userLoading, user]);

  if (userLoading) {
    return <Layout><div className="flex justify-center items-center h-[50vh] text-muted-foreground font-bold tracking-widest uppercase">Loading...</div></Layout>;
  }

  if (!user) return null;

  const handleSubmit = () => {
    if (!instructorId) return;
    createReview.mutate(
      {
        data: {
          instructorId: parseInt(instructorId),
          sessionId: initialSessionId ? parseInt(initialSessionId) : undefined,
          value,
          effectiveness,
          punctuality,
          comment: comment.trim() || undefined,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInstructorReviewsQueryKey(parseInt(instructorId)) });
          queryClient.invalidateQueries({ queryKey: getListMyReviewsQueryKey() });
          setLocation(`/instructors/${instructorId}`);
        },
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Leave a Review</h1>
          <p className="text-sm text-slate-500 mt-1">Drag each slider to rate your instructor</p>
        </div>

        {!initialInstructorId && (
          <div className="bg-white rounded-2xl p-6 mb-4 text-center" style={{ border: '1px solid #f1f5f9' }}>
            <p className="text-sm text-slate-500 mb-4">Select an instructor to review:</p>
            <select
              className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-blue-400 mb-0"
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
            >
              <option value="" disabled>Select an instructor...</option>
              {instructors?.items.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>
        )}

        {(instructorId || initialInstructorId) && (
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f1f5f9' }}>
            <div className="mb-6 pb-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Reviewing</p>
              <p className="text-lg font-bold text-slate-800">
                {selectedInstructor?.name ?? 'Loading...'}
              </p>
              <p className="text-xs text-slate-400 mt-1">🔒 Your review is completely anonymous</p>
            </div>

            <div className="flex justify-center gap-10 mb-6">
              <VerticalSlider label="Value" emoji="💰" value={value} onChange={setValue} />
              <VerticalSlider label="Effectiveness" emoji="📈" value={effectiveness} onChange={setEffectiveness} />
              <VerticalSlider label="Punctuality" emoji="⏰" value={punctuality} onChange={setPunctuality} />
            </div>

            <div
              className="text-center rounded-xl py-3 mb-5"
              style={{ background: scoreColor(overall) + '12' }}
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Overall Score</p>
              <p className="text-3xl font-bold" style={{ color: scoreColor(overall) }}>
                {overall.toFixed(1)}
              </p>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                Comment <span className="font-normal normal-case">(optional)</span>
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-700 resize-none focus:outline-none focus:border-blue-400"
                rows={3}
                placeholder="Share your experience... (optional)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                maxLength={500}
              />
              {comment.length > 0 && (
                <p className="text-xs text-slate-400 text-right mt-1">{comment.length}/500</p>
              )}
            </div>

            {createReview.isError && (
              <p className="text-sm text-red-500 mb-4 text-center">
                {(createReview.error as Error)?.message ?? 'Failed to submit review'}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={createReview.isPending || !instructorId}
              className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50 transition-opacity"
              style={{ background: '#1668c8' }}
            >
              {createReview.isPending ? 'Submitting...' : 'Submit Anonymous Review'}
            </button>

            <p className="text-xs text-slate-400 text-center mt-3">
              🔒 Your identity is never revealed to the instructor
            </p>
          </div>
        )}

        {!instructorId && !initialInstructorId && (
          <div className="text-center mt-4">
            <Link href="/instructors" className="text-sm text-blue-600 underline">
              Browse instructors to find one to review →
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
