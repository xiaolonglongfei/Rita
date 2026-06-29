"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddInstructorForm() {
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [teachingLocations, setTeachingLocations] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    if (!fullName.trim()) {
      setError("Instructor name is required");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          bio: bio.trim() || null,
          teaching_locations: teachingLocations.trim() || null,
          created_by_source: "student",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create instructor");
      }

      const { instructor } = await res.json();
      router.push(`/instructors/${instructor.id}?created=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
            Instructor Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. John Smith"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
            About{" "}
            <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>
          <textarea
            placeholder="Anything you know about this instructor's background or specialty..."
            className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-orange-300"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
            Teaching Location{" "}
            <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Scarsdale Tennis Club"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
            value={teachingLocations}
            onChange={(e) => setTeachingLocations(e.target.value)}
          />
        </div>

        <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 leading-relaxed">
          ℹ️ This instructor&apos;s profile will appear as &quot;Unclaimed&quot; until they sign up and
          verify their identity. You&apos;ll be able to write a review for them right away.
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !fullName.trim()}
          className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50"
          style={{ background: "#f97316" }}
        >
          {submitting ? "Creating..." : "Add Instructor"}
        </button>
      </div>
    </div>
  );
}
