"use client";

import { useState } from "react";

interface Instructor {
  id: string;
  full_name: string;
  bio: string | null;
  teaching_locations: string | null;
  internal_notes: string | null;
  is_claimed: boolean;
  avg_overall: number;
  total_reviews: number;
}

export function InstructorAdminTable({ instructors }: { instructors: Instructor[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newInternalNotes, setNewInternalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Expandable row state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Per-row internal notes edit state
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});
  const [savedNotes, setSavedNotes] = useState<Record<string, boolean>>({});

  async function handleAdd() {
    if (!newName.trim()) return;
    setSubmitting(true);
    await fetch("/api/admin/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        bio: newBio || null,
        location: newLocation || null,
        specialty: "",
        internalNotes: newInternalNotes.trim() || undefined,
      }),
    });
    window.location.reload();
  }

  function toggleRow(id: string, currentNotes: string | null) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Pre-fill the textarea with the current value if not already editing
      if (editNotes[id] === undefined) {
        setEditNotes((prev) => ({ ...prev, [id]: currentNotes ?? "" }));
      }
    }
  }

  async function handleSaveNotes(id: string) {
    setSavingNotes((prev) => ({ ...prev, [id]: true }));
    await fetch(`/api/admin/instructors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalNotes: editNotes[id] || "" }),
    });
    setSavingNotes((prev) => ({ ...prev, [id]: false }));
    setSavedNotes((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setSavedNotes((prev) => ({ ...prev, [id]: false })), 2000);
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
            placeholder="Bio (optional) — shown publicly on the instructor's profile"
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

          {/* Internal notes — visually distinct from bio */}
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
              🔒 Internal notes (admin-only — never shown to students or instructors)
            </label>
            <textarea
              placeholder="e.g. 'first name only as published', 'spelling unconfirmed'…"
              className="border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-400"
              rows={2}
              value={newInternalNotes}
              onChange={(e) => setNewInternalNotes(e.target.value)}
            />
          </div>

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
              <>
                <tr
                  key={inst.id}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleRow(inst.id, inst.internal_notes)}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {inst.full_name}
                    {inst.internal_notes && (
                      <span
                        className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded bg-amber-100 text-amber-700"
                        title="Has internal notes"
                      >
                        note
                      </span>
                    )}
                  </td>
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

                {expandedId === inst.id && (
                  <tr key={`${inst.id}-detail`} className="border-t border-amber-100 bg-amber-50/40">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="flex flex-col gap-4">

                        {/* Public bio — clearly labelled */}
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                            📄 Public bio
                          </p>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {inst.bio || <span className="italic text-slate-400">No bio</span>}
                          </p>
                        </div>

                        {/* Internal notes — distinct amber styling */}
                        <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                            🔒 Internal notes (admin-only)
                          </p>
                          <textarea
                            className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-400"
                            rows={3}
                            placeholder="e.g. 'first name only as published', 'spelling unconfirmed'…"
                            value={editNotes[inst.id] ?? inst.internal_notes ?? ""}
                            onChange={(e) =>
                              setEditNotes((prev) => ({ ...prev, [inst.id]: e.target.value }))
                            }
                          />
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSaveNotes(inst.id); }}
                              disabled={savingNotes[inst.id]}
                              className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
                              style={{ background: "#f97316" }}
                            >
                              {savingNotes[inst.id] ? "Saving…" : "Save notes"}
                            </button>
                            {savedNotes[inst.id] && (
                              <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>
                            )}
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </>
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
