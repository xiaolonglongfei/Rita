import { Layout } from "@/components/layout";
import { useCreateSession, useListInstructors, getListSessionsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function NewSession() {
  const [instructorId, setInstructorId] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createSession = useCreateSession();
  const { data: instructors } = useListInstructors({ limit: 100 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructorId || !sessionDate) return;

    createSession.mutate(
      { data: { instructorId: parseInt(instructorId), sessionDate, notes } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          setLocation("/sessions");
        },
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Log a Session</h1>
        <div className="border p-6 bg-card">
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <label className="block text-sm font-bold mb-2">Date</label>
              <input 
                type="date" 
                className="w-full p-3 border rounded bg-background"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Notes (Optional)</label>
              <textarea 
                className="w-full p-3 border rounded bg-background min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you work on?"
              />
            </div>
            <button 
              type="submit" 
              disabled={createSession.isPending || !instructorId || !sessionDate}
              className="w-full bg-primary text-primary-foreground p-3 rounded font-bold hover:bg-primary/90 disabled:opacity-50"
            >
              {createSession.isPending ? "Saving..." : "Save Session"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
