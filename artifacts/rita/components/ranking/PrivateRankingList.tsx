"use client";

import { useState } from "react";

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

export function PrivateRankingList({ initialRanked, unranked }: Props) {
  const [ranked, setRanked] = useState<Instructor[]>(initialRanked);
  const [unrankedList, setUnrankedList] = useState<Instructor[]>(unranked);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
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

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newRanked = [...ranked];
    const [moved] = newRanked.splice(dragIdx, 1);
    newRanked.splice(idx, 0, moved);
    setDragIdx(idx);
    setRanked(newRanked);
  }

  async function handleDrop(idx: number) {
    if (dragIdx === null) return;
    const newRanked = [...ranked];
    showToast(`${newRanked[idx].full_name} moved to #${idx + 1}`);
    setDragIdx(null);
    await saveRanking(newRanked);
  }

  async function addToRanking(instructor: Instructor) {
    const newRanked = [...ranked, instructor];
    setRanked(newRanked);
    setUnrankedList(unrankedList.filter((i) => i.id !== instructor.id));
    showToast(`${instructor.full_name} added to your ranking`);
    await saveRanking(newRanked);
  }

  async function removeFromRanking(instructor: Instructor) {
    const newRanked = ranked.filter((i) => i.id !== instructor.id);
    setRanked(newRanked);
    setUnrankedList([...unrankedList, instructor]);
    showToast(`${instructor.full_name} removed from ranking`);
    await saveRanking(newRanked);
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
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              className="bg-white rounded-xl p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing select-none"
              style={{
                border: dragIdx === i ? "1.5px solid #f97316" : "1.5px solid #f1f5f9",
                boxShadow:
                  dragIdx === i ? "0 4px 16px rgba(249,115,22,0.15)" : undefined,
                transform: dragIdx === i ? "scale(1.02)" : undefined,
                transition: "all 0.15s",
              }}
            >
              {/* Rank number */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background:
                    i === 0
                      ? "#fef3c7"
                      : i === 1
                      ? "#f1f5f9"
                      : i === 2
                      ? "#fde8d8"
                      : "#fff7ed",
                  color:
                    i === 0
                      ? "#92400e"
                      : i === 1
                      ? "#475569"
                      : i === 2
                      ? "#7c2d12"
                      : "#f97316",
                  border: `2px solid ${
                    i === 0
                      ? "#fcd34d"
                      : i === 1
                      ? "#cbd5e1"
                      : i === 2
                      ? "#fdba74"
                      : "#fed7aa"
                  }`,
                }}
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
                <div className="hidden sm:flex gap-1.5 flex-shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "#fff7ed", color: scoreColor(inst.avg_value) }}
                  >
                    V {inst.avg_value?.toFixed(1)}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "#fff7ed", color: scoreColor(inst.avg_effectiveness) }}
                  >
                    E {inst.avg_effectiveness?.toFixed(1)}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "#fff7ed", color: scoreColor(inst.avg_punctuality) }}
                  >
                    P {inst.avg_punctuality?.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Drag handle + remove */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-300 text-lg select-none">⠿</span>
                <button
                  onClick={() => removeFromRanking(inst)}
                  className="text-slate-300 hover:text-red-400 text-xl leading-none"
                  title="Remove from ranking"
                >
                  ×
                </button>
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
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-600">{inst.full_name}</p>
                  {inst.total_reviews > 0 && (
                    <p className="text-xs text-slate-400">⭐ {inst.avg_overall?.toFixed(1)}</p>
                  )}
                </div>
                <button
                  onClick={() => addToRanking(inst)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
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
      <div className="bg-orange-50 rounded-xl p-4 text-xs text-orange-700 leading-relaxed border border-orange-100">
        ℹ️ Your personal ranking is combined with other students&apos; rankings to generate Rovi&apos;s
        platform-wide public ranking — without revealing your individual list.
      </div>

      {/* Saving indicator */}
      {saving && <p className="text-xs text-slate-400 text-center mt-3">Saving...</p>}

      {/* Toast */}
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
