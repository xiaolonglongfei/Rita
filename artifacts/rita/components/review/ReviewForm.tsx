"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, MapPin, Info, ShieldCheck, CircleDollarSign, TrendingUp } from "lucide-react";
import { getLocalSessionDefaults } from "@/lib/session-defaults";
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
  instructorLocation?: string | null;
}

function scoreColor(s: number): string {
  if (s >= 4.0) return "#f97316";
  if (s >= 2.5) return "#c89000";
  return "#c83030";
}

export function ReviewForm({ instructorId, instructorName, instructorLocation }: ReviewFormProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [sessionLocation, setSessionLocation] = useState(instructorLocation ?? "");
  const [today, setToday] = useState("");

  useEffect(() => {
    const local = getLocalSessionDefaults();
    setSessionTime(local.time);
    setToday(local.date);
  }, []);

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

  function handleStep1Submit() {
    if (!sessionDate || !sessionTime || !sessionLocation.trim()) {
      setError("Please fill in all session details");
      return;
    }
    if (sessionDate > getLocalSessionDefaults().date) {
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
    // Client-side check is for real-time blur feedback only.
    // The request always reaches the server — server is the single source of
    // truth for blocking AND logging. Server errors surface via setError below.

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
      const { review } = await res.json();
      router.push(`/reviews/submitted?review=${encodeURIComponent(review.id)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="review-form min-w-0 w-full bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 max-w-md mx-auto shadow-sm">
      {/* Header */}
      <div className="mb-6 pb-5 border-b border-slate-100 text-center">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Reviewing
        </p>
        <p className="text-lg font-bold text-slate-800">{instructorName}</p>
        <p className="flex items-center justify-center gap-2 text-xs text-slate-600 mt-1"><ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" />Your rating and comments stay anonymous</p>
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
            <label htmlFor="session-date" className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
              <CalendarDays aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" /> Session Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              id="session-date"
              className="session-input"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              max={today}
            />
          </div>

          <div>
            <label htmlFor="session-time" className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Clock3 aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" /> Session Time <span className="text-red-400">*</span>
            </label>
            <input
              type="time"
              id="session-time"
              className="session-input"
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="session-location" className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
              <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" /> Session Location <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="session-location"
              placeholder="e.g. Your tennis club"
              className="session-input"
              value={sessionLocation}
              onChange={(e) => setSessionLocation(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
            <Info aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" />
            <span>If your instructor has a Rovi profile, they&apos;ll be asked to confirm this session happened. They&apos;ll see your name, date, time, and location, but never your rating or comments.</span>
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
            <p className="flex items-start gap-2">
              <CalendarDays aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" />
              {new Date(`${sessionDate}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="flex items-start gap-2"><Clock3 aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" />{sessionTime}</p>
            <p className="flex items-start gap-2"><MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" /><span className="min-w-0 break-words">{sessionLocation}</span></p>
            <button
              onClick={() => setStep(1)}
              className="text-orange-500 font-semibold mt-1 hover:underline"
            >
              ← Edit details
            </button>
          </div>

          {/* Vertical sliders */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-6">
            <VerticalSlider label="Value" icon={CircleDollarSign} value={value} onChange={setValue} />
            <VerticalSlider
              label="Effectiveness"
              icon={TrendingUp}
              value={effectiveness}
              onChange={setEffectiveness}
            />
            <VerticalSlider
              label="Punctuality"
              icon={Clock3}
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

          <p className="flex items-center justify-center gap-2 text-xs text-slate-600 text-center mt-3">
            <ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-rita-primary" /> Your rating and comments stay anonymous
          </p>
        </div>
      )}
    </div>
  );
}
