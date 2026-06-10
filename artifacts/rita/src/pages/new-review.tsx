import { Layout } from "@/components/layout";
import { useCreateReview, useListInstructors, getGetInstructorReviewsQueryKey, getListMyReviewsQueryKey } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function NewReview() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialInstructorId = params.get("instructorId") || "";
  const initialSessionId = params.get("sessionId") || "";

  const [instructorId, setInstructorId] = useState(initialInstructorId);
  const [value, setValue] = useState(3);
  const [effectiveness, setEffectiveness] = useState(3);
  const [punctuality, setPunctuality] = useState(3);
  const [comment, setComment] = useState("");

  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createReview = useCreateReview();
  const { data: instructors } = useListInstructors({ limit: 100 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructorId) return;

    createReview.mutate(
      {
        data: {
          instructorId: parseInt(instructorId),
          sessionId: initialSessionId ? parseInt(initialSessionId) : undefined,
          value,
          effectiveness,
          punctuality,
          comment
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
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Submit Review</h1>
        <div className="border p-8 bg-card rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-bold mb-2">Instructor</label>
              <select
                className="w-full p-3 border rounded bg-background"
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
                required
              >
                <option value="" disabled>Select an instructor...</option>
                {instructors?.items.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-6">
              <h3 className="text-xl font-bold border-b pb-2">Rate Your Experience</h3>
              <SliderField
                label="💰 Value"
                description="Was the lesson worth the money?"
                value={value}
                onChange={setValue}
              />
              <SliderField
                label="📈 Effectiveness"
                description="Did the instructor improve your game?"
                value={effectiveness}
                onChange={setEffectiveness}
              />
              <SliderField
                label="⏰ Punctuality"
                description="Was the instructor on time and reliable?"
                value={punctuality}
                onChange={setPunctuality}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Comment (Optional)</label>
              <textarea
                className="w-full p-3 border rounded bg-background min-h-[120px]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details of your experience..."
              />
            </div>

            <button
              type="submit"
              disabled={createReview.isPending || !instructorId}
              className="w-full bg-primary text-primary-foreground p-4 rounded font-bold hover:bg-primary/90 disabled:opacity-50 text-lg"
            >
              {createReview.isPending ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

function SliderField({ label, description, value, onChange }: { label: string; description: string; value: number; onChange: (val: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div>
          <label className="text-sm font-bold">{label}</label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="font-mono font-bold text-lg w-10 text-right text-accent">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min="1" max="5" step="0.5"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent mt-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
    </div>
  );
}
