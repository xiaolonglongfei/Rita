import { Layout } from "@/components/layout";
import { useCreateReview, useListInstructors, getGetInstructorReviewsQueryKey, getListMyReviewsQueryKey } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function NewReview() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialInstructorId = params.get("instructorId") || "";
  const initialSessionId = params.get("sessionId") || "";

  const [instructorId, setInstructorId] = useState(initialInstructorId);
  const [technique, setTechnique] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [patience, setPatience] = useState(3);
  const [adaptability, setAdaptability] = useState(3);
  const [expertise, setExpertise] = useState(3);
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
          technique,
          communication,
          patience,
          adaptability,
          expertise,
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
        <div className="border p-8 bg-card">
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
              <h3 className="text-xl font-bold border-b pb-2">Dimensions</h3>
              <SliderField label="Technique" value={technique} onChange={setTechnique} />
              <SliderField label="Communication" value={communication} onChange={setCommunication} />
              <SliderField label="Patience" value={patience} onChange={setPatience} />
              <SliderField label="Adaptability" value={adaptability} onChange={setAdaptability} />
              <SliderField label="Expertise" value={expertise} onChange={setExpertise} />
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

function SliderField({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-bold">{label}</label>
        <span className="font-mono font-bold w-8 text-right text-accent">{value.toFixed(1)}</span>
      </div>
      <input 
        type="range" 
        min="1" max="5" step="0.5" 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent"
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
