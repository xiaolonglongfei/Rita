"use client";

import { useState } from "react";

interface Instructor {
  id: string;
  full_name: string;
  bio: string | null;
  teaching_locations: string | null;
  is_claimed: boolean;
  avg_overall: number;
  total_reviews: number;
}

export function InstructorAdminTable({ instructors }: { instructors: Instructor[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSubmitting(true);
    await fetch("/api/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: newName.trim(),
        bio: newBio || null,
        teaching_locations: newLocation || null,
      }),
    });
    window.location.reload();
  }

  return (
    <div>
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="mb-4 px-4 py-2 rounded-lg text-white text-sm font-semibold"
        style={{ background: "#f97316" }}
      >
        {showAddForm ? "Cancel" : "+ Add Instructor"}
      </button>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-5 mb-6 flex flex-col gap-3">
          <input
            type="text"
            placeholder="Full name *"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-300"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <textarea
            placeholder="Bio (optional)"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-orange-300"
            rows={2}
            value={newBio}
            onChange={(e) => setNewBio(e.target.value)}
          />
          <input
            type="text"
            placeholder="Teaching locations (optional)"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-300"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
          <button
            onClick={handleAdd}
            disabled={submitting || !newName.trim()}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 self-start"
            style={{ background: "#f97316" }}
          >
            {submitting ? "Adding..." : "Save Instructor"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Location</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Score</th>
              <th className="text-left px-4 py-3">Reviews</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map((inst) => (
              <tr key={inst.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{inst.full_name}</td>
                <td className="px-4 py-3 text-slate-500">{inst.teaching_locations || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: inst.is_claimed ? "#fff7ed" : "#f1f5f9",
                      color: inst.is_claimed ? "#f97316" : "#64748b",
                    }}
                  >
                    {inst.is_claimed ? "Claimed" : "Unclaimed"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {inst.total_reviews > 0 ? `⭐ ${inst.avg_overall?.toFixed(1)}` : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">{inst.total_reviews}</td>
              </tr>
            ))}
            {instructors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No instructors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
