"use client";

import { useState } from "react";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";

interface Instructor {
  id: string;
  rankId?: string;
  position?: number;
  full_name: string;
  avg_overall: number;
  avg_value: number;
  avg_effectiveness: number;
  avg_punctuality: number;
  total_reviews: number;
}

interface Props {
  initialRanked: Instructor[];
  unranked: Instructor[];
  studentId: string;
}

const medals = ["🥇", "🥈", "🥉"];

function scoreColor(s: number): string {
  if (s >= 4.0) return "#f97316";
  if (s >= 2.5) return "#c89000";
  return "#c83030";
}

// Rank circle background/border/text per position
function rankStyle(i: number) {
  const styles = [
    { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
    { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
    { bg: "#fde8d8", color: "#7c2d12", border: "#fdba74" },
  ];
  const s = styles[i] ?? { bg: "#fff7ed", color: "#f97316", border: "#fed7aa" };
  return {
    background: s.bg,
    color: s.color,
    border: `2px solid ${s.border}`,
  };
}

export function PrivateRankingList({ initialRanked, unranked }: Props) {
  const [ranked, setRanked] = useState<Instructor[]>(initialRanked);
  const [unrankedList, setUnrankedList] = useState<Instructor[]>(unranked);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [draggableRow, setDraggableRow] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function saveRanking(newRanked: Instructor[]) {
    setSaving(true);
    try {
      await fetch("/api/rankings/private", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rankings: newRanked.map((inst, i) => ({
            instructor_id: inst.id,
            rank_position: i + 1,
          })),
        }),
      });
    } catch (e) {
      console.error("Failed to save ranking", e);
    } finally {
      setSaving(false);
    }
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────
  function handleDragStart(idx: number) { setDragIdx(idx); }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const r = [...ranked];
    const [moved] = r.splice(dragIdx, 1);
    r.splice(idx, 0, moved);
    setDragIdx(idx);
    setRanked(r);
  }

  async function handleDrop(idx: number) {
    if (dragIdx === null) return;
    const r = [...ranked];
    showToast(`${r[idx].full_name} moved to #${idx + 1}`);
    setDragIdx(null);
    setDraggableRow(null);
    await saveRanking(r);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDraggableRow(null);
  }

  // ── Arrow handlers ────────────────────────────────────────────────────────
  async function moveUp(i: number) {
    if (i === 0) return;
    const r = [...ranked];
    [r[i - 1], r[i]] = [r[i], r[i - 1]];
    setRanked(r);
    showToast(`${r[i - 1].full_name} moved to #${i}`);
    await saveRanking(r);
  }

  async function moveDown(i: number) {
    if (i === ranked.length - 1) return;
    const r = [...ranked];
    [r[i + 1], r[i]] = [r[i], r[i + 1]];
    setRanked(r);
    showToast(`${r[i + 1].full_name} moved to #${i + 2}`);
    await saveRanking(r);
  }

  // ── Add / remove ──────────────────────────────────────────────────────────
  async function addToRanking(instructor: Instructor) {
    const n = [...ranked, instructor];
    setRanked(n);
    setUnrankedList(unrankedList.filter((i) => i.id !== instructor.id));
    showToast(`${instructor.full_name} added to your ranking`);
    await saveRanking(n);
  }

  async function removeFromRanking(instructor: Instructor) {
    const n = ranked.filter((i) => i.id !== instructor.id);
    setRanked(n);
    setUnrankedList([...unrankedList, instructor]);
    showToast(`${instructor.full_name} removed from ranking`);
    await saveRanking(n);
  }

  return (
    <div>
      {/* Private badge */}
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
        style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}
      >
        🔒 Private — visible only to you
      </div>

      {/* Ranked list */}
      {ranked.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6 text-center mb-4">
          <p className="text-sm text-slate-400">You haven&apos;t ranked any instructors yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Write a review first, then add instructors to your ranking below.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {ranked.map((inst, i) => (
            <div
              key={inst.id}
              draggable={draggableRow === i}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
              className="bg-white rounded-xl px-3 py-3 select-none"
              style={{
                border: dragIdx === i ? "1.5px solid #f97316" : "1.5px solid #f1f5f9",
                boxShadow: dragIdx === i ? "0 4px 16px rgba(249,115,22,0.15)" : undefined,
                transform: dragIdx === i ? "scale(1.02)" : undefined,
                transition: "all 0.15s",
              }}
            >
              {/* ── MOBILE layout (two-line) — hidden on sm+ ─────────────── */}
              <div className="flex flex-col gap-1.5 sm:hidden">

                {/* Top row: handle | rank+medal | avatar | full name (wraps, no truncation) */}
                <div className="flex items-center gap-2">

                  {/* Drag handle */}
                  <div
                    className="flex-shrink-0 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
                    style={{ touchAction: "none", minWidth: 28, minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onPointerDown={() => setDraggableRow(i)}
                    onPointerUp={() => { if (dragIdx === null) setDraggableRow(null); }}
                    title="Drag to reorder"
                  >
                    <GripVertical size={18} />
                  </div>

                  {/* Rank number with medal badge overlay */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={rankStyle(i)}
                    >
                      {i + 1}
                    </div>
                    {medals[i] && (
                      <span className="absolute -top-1.5 -right-1.5 text-[11px] leading-none">
                        {medals[i]}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "#f97316" }}
                  >
                    {inst.full_name.charAt(0)}
                  </div>

                  {/* Full name — flex-1 + min-w-0 so it can shrink; NO truncate so it wraps */}
                  <p className="text-sm font-semibold text-slate-800 flex-1 min-w-0">
                    {inst.full_name}
                  </p>
                </div>

                {/* Bottom row: star/count | spacer | up/down + delete */}
                <div className="flex items-center justify-between pl-1">
                  {/* Star rating — left side */}
                  <div>
                    {inst.total_reviews > 0 ? (
                      <p className="text-xs text-slate-400">
                        ⭐ {inst.avg_overall?.toFixed(1)} · {inst.total_reviews} review{inst.total_reviews !== 1 ? "s" : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-300">No reviews yet</p>
                    )}
                  </div>

                  {/* Controls — right side; each button 44×44px tap target */}
                  <div className="flex items-center">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      style={{ minWidth: 44, minHeight: 44 }}
                      aria-label={`Move ${inst.full_name} up`}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === ranked.length - 1}
                      className="flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      style={{ minWidth: 44, minHeight: 44 }}
                      aria-label={`Move ${inst.full_name} down`}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => removeFromRanking(inst)}
                      className="flex items-center justify-center text-slate-300 hover:text-red-400 text-xl leading-none transition-colors"
                      style={{ minWidth: 44, minHeight: 44 }}
                      aria-label={`Remove ${inst.full_name} from ranking`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              {/* ── DESKTOP layout (single row, unchanged from Prompt #30) ── */}
              <div className="hidden sm:flex items-center gap-3">

                {/* Drag handle */}
                <div
                  className="flex-shrink-0 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
                  style={{ touchAction: "none" }}
                  onPointerDown={() => setDraggableRow(i)}
                  onPointerUp={() => { if (dragIdx === null) setDraggableRow(null); }}
                  title="Drag to reorder"
                >
                  <GripVertical size={20} />
                </div>

                {/* Rank number */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={rankStyle(i)}
                >
                  {i + 1}
                </div>

                {/* Medal */}
                <span className="text-lg w-6 text-center flex-shrink-0">
                  {medals[i] || ""}
                </span>

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: "#f97316" }}
                >
                  {inst.full_name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{inst.full_name}</p>
                  {inst.total_reviews > 0 && (
                    <p className="text-xs text-slate-400">
                      ⭐ {inst.avg_overall?.toFixed(1)} · {inst.total_reviews} reviews
                    </p>
                  )}
                </div>

                {/* Score pills */}
                {inst.total_reviews > 0 && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#fff7ed", color: scoreColor(inst.avg_value) }}>
                      V {inst.avg_value?.toFixed(1)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#fff7ed", color: scoreColor(inst.avg_effectiveness) }}>
                      E {inst.avg_effectiveness?.toFixed(1)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#fff7ed", color: scoreColor(inst.avg_punctuality) }}>
                      P {inst.avg_punctuality?.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* ▲▼ + remove */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      style={{ minWidth: 44, minHeight: 44 }}
                      aria-label={`Move ${inst.full_name} up`}
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === ranked.length - 1}
                      className="flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      style={{ minWidth: 44, minHeight: 44 }}
                      aria-label={`Move ${inst.full_name} down`}
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromRanking(inst)}
                    className="flex items-center justify-center text-slate-300 hover:text-red-400 text-xl leading-none transition-colors"
                    style={{ minWidth: 44, minHeight: 44 }}
                    aria-label={`Remove ${inst.full_name} from ranking`}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unranked instructors */}
      {unrankedList.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Add to your ranking
          </p>
          <div className="flex flex-col gap-2">
            {unrankedList.map((inst) => (
              <div
                key={inst.id}
                className="bg-white rounded-xl p-4 flex items-center gap-3"
                style={{ border: "1.5px dashed #e2e8f0" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: "#94a3b8" }}
                >
                  {inst.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-600">{inst.full_name}</p>
                  {inst.total_reviews > 0 && (
                    <p className="text-xs text-slate-400">⭐ {inst.avg_overall?.toFixed(1)}</p>
                  )}
                </div>
                <button
                  onClick={() => addToRanking(inst)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white flex-shrink-0"
                  style={{ background: "#f97316" }}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="bg-orange-50 rounded-xl p-4 text-sm text-orange-700 leading-relaxed border border-orange-100">
        ℹ️ Your personal ranking is combined with other students&apos; rankings to generate Rovi&apos;s
        platform-wide public ranking — without revealing your individual list.
      </div>

      {saving && <p className="text-xs text-slate-400 text-center mt-3">Saving...</p>}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-white text-sm font-medium"
          style={{ background: "#1e2a38", zIndex: 999 }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
