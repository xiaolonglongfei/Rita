"use client";

import { useState } from "react";
import { VerticalSlider } from "./VerticalSlider";
import { useRouter } from "next/navigation";
import {
  checkReviewContentLayer1,
  blockerMessage,
  warningMessage,
} from "@/lib/moderation/layer1";

interface ReviewFormProps {
  instructorId: string;
  instructorName: string;
  studentName: string;
}

function scoreColor(s: number): string {
  if (s >= 4.0) return "#f97316";
  if (s >= 2.5) return "#c89000";
  return "#c83030";
}

export function ReviewForm({ instructorId, instructorName }: ReviewFormProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");

  const [value, setValue] = useState(5);
  const [effectiveness, setEffectiveness] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentWarning, setCommentWarning] = useState("");
  const router = useRouter();

  const overall = (value + effectiveness + punctuality) / 3;
  const today = new Date().toISOString().split("T")[0];

  function handleStep1Submit() {
    if (!sessionDate || !sessionTime || !sessionLocation.trim()) {
      setError("Please fill in all session details");
      return;
    }
    if (new Date(sessionDate) > new Date()) {
      setError("Session date cannot be in the future");
      return;
    }
    setError("");
    setStep(2);
  }

  function handleCommentBlur() {
    if (!comment.trim()) {
      setCommentError("");
      setCommentWarning("");
      return;
    }
    const result = checkReviewContentLayer1(comment);
    setCommentError(result.passed ? "" : blockerMessage(result.blockers));
    setCommentWarning(result.warnings.length > 0 ? warningMessage(result.warnings) : "");
  }

  async function handleFinalSubmit() {
    // Re-run content check before submitting (catches paste-then-submit without blur)
    if (comment.trim()) {
      const result = checkReviewContentLayer1(comment);
      if (!result.passed) {
        setCommentError(blockerMessage(result.blockers));
        return;
      }
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructor_id: instructorId,
          rating_value: value,
          rating_effectiveness: effectiveness,
          rating_punctuality: punctuality,
          comment: comment.trim() || null,
          session_date: sessionDate,
          session_time: sessionTime,
          session_location: sessionLocation.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }
      router.push(`/instructors/${instructorId}?reviewed=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-md mx-auto shadow-sm">
      {/* Header */}
      <div className="mb-6 pb-5 border-b border-slate-100 text-center">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Reviewing
        </p>
        <p className="text-lg font-bold text-slate-800">{instructorName}</p>
        <p className="text-xs text-slate-400 mt-1">🔒 Your review is completely anonymous</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "#f97316", color: "white" }}
          >
            1
          </div>
          <span
            className="text-xs font-semibold"
            style={{ color: step === 1 ? "#f97316" : "#94a3b8" }}
          >
            Session Details
          </span>
        </div>
        <div className="w-8 h-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: step === 2 ? "#f97316" : "#e2e8f0",
              color: step === 2 ? "white" : "#94a3b8",
            }}
          >
            2
          </div>
          <span
            className="text-xs font-semibold"
            style={{ color: step === 2 ? "#f97316" : "#94a3b8" }}
          >
            Your Rating
          </span>
        </div>
      </div>

      {/* STEP 1: Session Details */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
              📅 Session Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              max={today}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
              🕐 Session Time <span className="text-red-400">*</span>
            </label>
            <input
              type="time"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
              📍 Session Location <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Pound Ridge Tennis Club"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-300"
              value={sessionLocation}
              onChange={(e) => setSessionLocation(e.target.value)}
            />
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 leading-relaxed">
            ℹ️ Your instructor will be asked to confirm this session happened. They will see your
            name, date, time, and location — but not your rating.
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            onClick={handleStep1Submit}
            className="w-full py-3 rounded-xl text-white font-bold text-base"
            style={{ background: "#f97316" }}
          >
            Next — Rate your session →
          </button>
        </div>
      )}

      {/* STEP 2: Rating */}
      {step === 2 && (
        <div>
          {/* Session summary */}
          <div className="bg-slate-50 rounded-xl p-3 mb-5 text-xs text-slate-600">
            <p className="font-semibold text-slate-700 mb-1">Session details:</p>
            <p>
              📅{" "}
              {new Date(sessionDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p>🕐 {sessionTime}</p>
            <p>📍 {sessionLocation}</p>
            <button
              onClick={() => setStep(1)}
              className="text-orange-500 font-semibold mt-1 hover:underline"
            >
              ← Edit details
            </button>
          </div>

          {/* Vertical sliders */}
          <div className="flex justify-center gap-10 mb-6">
            <VerticalSlider label="Value" emoji="💰" value={value} onChange={setValue} />
            <VerticalSlider
              label="Effectiveness"
              emoji="📈"
              value={effectiveness}
              onChange={setEffectiveness}
            />
            <VerticalSlider
              label="Punctuality"
              emoji="⏰"
              value={punctuality}
              onChange={setPunctuality}
            />
          </div>

          {/* Overall score */}
          <div
            className="text-center rounded-xl py-3 mb-5"
            style={{ background: scoreColor(overall) + "15" }}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
              Overall Score
            </p>
            <p className="text-3xl font-bold" style={{ color: scoreColor(overall) }}>
              {overall.toFixed(1)}
            </p>
          </div>

          {/* Optional comment */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">
              Comment <span className="font-normal normal-case">(optional)</span>
            </label>
            <textarea
              className={`w-full border rounded-lg p-3 text-sm text-slate-700 resize-none focus:outline-none transition-colors ${
                commentError
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-orange-300"
              }`}
              rows={3}
              placeholder="Share your experience... (optional)"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                // Clear error as user edits so they can see it re-validate on blur
                if (commentError) setCommentError("");
              }}
              onBlur={handleCommentBlur}
              maxLength={500}
            />
            <div className="flex justify-between items-start mt-1 gap-2">
              <div className="flex-1">
                {commentError && (
                  <p className="text-xs text-red-500">{commentError}</p>
                )}
                {!commentError && commentWarning && (
                  <p className="text-xs text-amber-600">{commentWarning}</p>
                )}
              </div>
              {comment.length > 0 && (
                <p className="text-xs text-slate-400 flex-shrink-0">{comment.length}/500</p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mb-4 text-center">{error}</p>}

          <button
            onClick={handleFinalSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50"
            style={{ background: "#f97316" }}
          >
            {submitting ? "Submitting..." : "Submit Anonymous Review"}
          </button>

          <p className="text-xs text-slate-400 text-center mt-3">
            🔒 Your identity is never revealed to the instructor
          </p>
        </div>
      )}
    </div>
  );
}
