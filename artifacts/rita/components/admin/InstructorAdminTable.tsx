"use client";

import { Fragment, useState } from "react";
import { BioSourceFields } from "./BioSourceFields";

interface Instructor {
  id: string;
  full_name: string;
  bio: string | null;
  teaching_locations: string | null;
  internal_notes: string | null;
  is_claimed: boolean;
  avg_overall: number;
  total_reviews: number;
  opted_out_at?: string | null;
  is_active?: boolean | null;
  created_by_source?: string | null;
  bio_source_url?: string | null;
  bio_source_checked_at?: string | null;
}

export function InstructorAdminTable({ instructors }: { instructors: Instructor[] }) {
  const [rows, setRows] = useState(instructors);
  const [filter, setFilter] = useState<"all" | "pending" | "bio-no-source">("all");
  const [approving, setApproving] = useState<string | null>(null);
  const [approveError, setApproveError] = useState("");
  const isPending = (inst: Instructor) => inst.created_by_source === "student" &&
    inst.is_active === false && inst.opted_out_at == null;
  const hasUnsourcedBio = (inst: Instructor) => !!inst.bio?.trim() && !inst.bio_source_url?.trim();
  const visibleRows = filter === "pending" ? rows.filter(isPending)
    : filter === "bio-no-source" ? rows.filter(hasUnsourcedBio) : rows;
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newInternalNotes, setNewInternalNotes] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceDate, setNewSourceDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [visibilityTarget, setVisibilityTarget] = useState<Instructor | null>(null);
  const [reason, setReason] = useState("");
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [visibilityError, setVisibilityError] = useState("");

  async function handleVisibility() {
    if (!visibilityTarget || visibilityBusy) return;
    setVisibilityBusy(true);
    setVisibilityError("");
    try {
      const response = await fetch(`/api/admin/instructors/${visibilityTarget.id}/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: visibilityTarget.opted_out_at ? "restore" : "opt_out", reason }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update this instructor.");
      const updated = body.instructor;
      setRows((current) => current.map((inst) => inst.id === updated.id ? { ...inst, ...updated } : inst));
      setEditNotes((current) => ({ ...current, [updated.id]: updated.internal_notes ?? "" }));
      setSavedNotes((current) => ({ ...current, [updated.id]: false }));
      setVisibilityTarget(null);
    } catch (error) {
      setVisibilityError(error instanceof Error ? error.message : "Unable to update this instructor.");
    } finally {
      setVisibilityBusy(false);
    }
  }

  // Expandable row state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Per-row internal notes edit state
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});
  const [savedNotes, setSavedNotes] = useState<Record<string, boolean>>({});
  const [noteErrors, setNoteErrors] = useState<Record<string, string>>({});
  const [editSources, setEditSources] = useState<Record<string, { url: string; checkedOn: string }>>({});
  const [savingSource, setSavingSource] = useState<Record<string, boolean>>({});
  const [sourceErrors, setSourceErrors] = useState<Record<string, string>>({});
  const [savedSource, setSavedSource] = useState<Record<string, boolean>>({});

  async function handleAdd() {
    if (!newName.trim()) return;
    setSubmitting(true);
    setAddError("");
    try {
      const response = await fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newName.trim(), bio: newBio || null,
          teaching_locations: newLocation || null, created_by_source: "admin",
          internalNotes: newInternalNotes.trim() || null,
          bio_source_url: newSourceUrl.trim() || null,
          bio_source_checked_at: newSourceDate || null,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Unable to add this instructor.");
      }
      window.location.reload();
    } catch (error) {
      setAddError(error instanceof Error ? error.message : "Unable to add this instructor.");
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    setApproving(id);
    setApproveError("");
    try {
      const response = await fetch(`/api/admin/instructors/${id}/approve`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Unable to approve this instructor.");
      }
      setRows((current) => current.map((inst) => inst.id === id ? { ...inst, is_active: true } : inst));
    } catch (error) {
      setApproveError(error instanceof Error ? error.message : "Unable to approve this instructor.");
    } finally {
      setApproving(null);
    }
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
    setSavedNotes((prev) => ({ ...prev, [id]: false }));
    setNoteErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      const response = await fetch(`/api/admin/instructors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: editNotes[id] || "" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save notes.");
      setRows((current) => current.map((inst) => inst.id === id ? { ...inst, internal_notes: body.instructor.internal_notes } : inst));
      setSavedNotes((prev) => ({ ...prev, [id]: true }));
    } catch (error) {
      setNoteErrors((prev) => ({ ...prev, [id]: error instanceof Error ? error.message : "Unable to save notes." }));
    } finally {
      setSavingNotes((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleSaveSource(inst: Instructor) {
    const draft = editSources[inst.id] ?? { url: inst.bio_source_url ?? "", checkedOn: inst.bio_source_checked_at ?? "" };
    setSavingSource((prev) => ({ ...prev, [inst.id]: true }));
    setSourceErrors((prev) => ({ ...prev, [inst.id]: "" }));
    setSavedSource((prev) => ({ ...prev, [inst.id]: false }));
    try {
      const response = await fetch(`/api/admin/instructors/${inst.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio_source_url: draft.url.trim() || null, bio_source_checked_at: draft.checkedOn || null }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save bio sourcing.");
      const updated = body.instructor;
      setRows((current) => current.map((row) => row.id === inst.id ? {
        ...row, bio_source_url: updated.bio_source_url, bio_source_checked_at: updated.bio_source_checked_at,
      } : row));
      setEditSources((prev) => ({ ...prev, [inst.id]: {
        url: updated.bio_source_url ?? "", checkedOn: updated.bio_source_checked_at ?? "",
      } }));
      setSavedSource((prev) => ({ ...prev, [inst.id]: true }));
    } catch (error) {
      setSourceErrors((prev) => ({ ...prev, [inst.id]: error instanceof Error ? error.message : "Unable to save bio sourcing." }));
    } finally {
      setSavingSource((prev) => ({ ...prev, [inst.id]: false }));
    }
  }

  return (
    <div>
      {visibilityTarget && (
        <dialog
          ref={(node) => { if (node && !node.open) node.showModal(); }}
          onCancel={(event) => {
            if (visibilityBusy) event.preventDefault();
            else setVisibilityTarget(null);
          }}
          aria-labelledby="visibility-title"
          className="w-full max-w-md rounded-2xl p-6 shadow-xl backdrop:bg-slate-900/40"
        >
          <form onSubmit={(event) => { event.preventDefault(); void handleVisibility(); }}>
            <h2 id="visibility-title" className="text-lg font-bold text-slate-900">
              {visibilityTarget.opted_out_at ? "Restore" : "Opt out"} {visibilityTarget.full_name}?
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              {visibilityTarget.opted_out_at
                ? "This makes the coach's profile active and publicly accessible again."
                : "This hides the coach from public pages and the directory. Their profile and all review data will be retained."}
            </p>
            {!visibilityTarget.opted_out_at && (
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Reason
                <textarea required autoFocus value={reason} onChange={(event) => setReason(event.target.value)}
                  disabled={visibilityBusy} rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-300 p-2 font-normal" />
              </label>
            )}
            {visibilityError && <p role="alert" className="mt-3 text-sm text-red-600">{visibilityError}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" disabled={visibilityBusy} onClick={() => setVisibilityTarget(null)}
                className="rounded-lg border px-3 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={visibilityBusy || (!visibilityTarget.opted_out_at && !reason.trim())}
                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {visibilityBusy ? "Saving…" : visibilityTarget.opted_out_at ? "Restore" : "Opt out"}
              </button>
            </div>
          </form>
        </dialog>
      )}
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

          <BioSourceFields url={newSourceUrl} checkedOn={newSourceDate}
            onUrlChange={setNewSourceUrl} onDateChange={setNewSourceDate} disabled={submitting} />

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
          {addError && <p role="alert" className="text-sm text-red-600">{addError}</p>}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2" aria-label="Instructor filters">
        <button onClick={() => setFilter("all")} aria-pressed={filter === "all"}
          className="rounded-lg border px-3 py-2 text-sm font-semibold aria-pressed:bg-slate-100">All</button>
        <button onClick={() => setFilter("pending")} aria-pressed={filter === "pending"}
          className="rounded-lg border px-3 py-2 text-sm font-semibold aria-pressed:bg-slate-100">
          Pending ({rows.filter(isPending).length})
        </button>
        <button onClick={() => setFilter("bio-no-source")} aria-pressed={filter === "bio-no-source"}
          className="rounded-lg border px-3 py-2 text-sm font-semibold aria-pressed:bg-slate-100">
          Bio, no source ({rows.filter(hasUnsourcedBio).length})
        </button>
      </div>
      {approveError && <p role="alert" className="mb-4 text-sm text-red-600">{approveError}</p>}
      <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Location</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Score</th>
              <th className="text-left px-4 py-3">Reviews</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((inst) => (
              <Fragment key={inst.id}>
                <tr
                  key={inst.id}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleRow(inst.id, inst.internal_notes)}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {inst.full_name}
                    {isPending(inst) && (
                      <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-normal text-amber-700">Pending</span>
                    )}
                    {inst.opted_out_at && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-600">
                        Opted out
                      </span>
                    )}
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
                  <td className="px-4 py-3">
                    {isPending(inst) && <button
                      onClick={(event) => { event.stopPropagation(); handleApprove(inst.id); }}
                      disabled={approving !== null}
                      className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                      {approving === inst.id ? "Approving…" : "Approve"}
                    </button>}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setReason("");
                        setVisibilityError("");
                        setVisibilityTarget(inst);
                      }}
                      disabled={approving !== null || visibilityBusy || !!savingNotes[inst.id]}
                      className="ml-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      {inst.opted_out_at ? "Restore" : "Opt out"}
                    </button>
                  </td>
                </tr>

                {expandedId === inst.id && (
                  <tr key={`${inst.id}-detail`} className="border-t border-amber-100 bg-amber-50/40">
                    <td colSpan={6} className="px-4 py-4">
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
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Bio sourcing (admin-only)</p>
                          <BioSourceFields
                            url={editSources[inst.id]?.url ?? inst.bio_source_url ?? ""}
                            checkedOn={editSources[inst.id]?.checkedOn ?? inst.bio_source_checked_at ?? ""}
                            onUrlChange={(url) => {
                              setSavedSource((prev) => ({ ...prev, [inst.id]: false }));
                              setEditSources((prev) => ({ ...prev, [inst.id]: {
                                url, checkedOn: prev[inst.id]?.checkedOn ?? inst.bio_source_checked_at ?? "",
                              } }));
                            }}
                            onDateChange={(checkedOn) => {
                              setSavedSource((prev) => ({ ...prev, [inst.id]: false }));
                              setEditSources((prev) => ({ ...prev, [inst.id]: {
                                url: prev[inst.id]?.url ?? inst.bio_source_url ?? "", checkedOn,
                              } }));
                            }}
                            disabled={!!savingSource[inst.id]}
                          />
                          <button onClick={() => handleSaveSource(inst)} disabled={savingSource[inst.id]}
                            className="mt-3 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                            {savingSource[inst.id] ? "Saving…" : "Save bio source"}
                          </button>
                          {savedSource[inst.id] && <span role="status" className="ml-3 text-xs text-emerald-600">Saved</span>}
                          {sourceErrors[inst.id] && <p role="alert" className="mt-2 text-xs text-red-600">{sourceErrors[inst.id]}</p>}
                        </div>

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
                              disabled={savingNotes[inst.id] || visibilityBusy}
                              className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
                              style={{ background: "#f97316" }}
                            >
                              {savingNotes[inst.id] ? "Saving…" : "Save notes"}
                            </button>
                            {savedNotes[inst.id] && (
                              <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>
                            )}
                            {noteErrors[inst.id] && <p role="alert" className="text-xs text-red-600">{noteErrors[inst.id]}</p>}
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                  {filter === "pending" ? "No pending instructors." : filter === "bio-no-source" ? "No instructors with a bio and no source." : "No instructors yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
