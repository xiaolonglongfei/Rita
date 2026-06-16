import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SessionsPage() {
  const supabase = await createClient();
  const db = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: instructorProfile } = await db
    .from("instructors")
    .select("id, full_name")
    .eq("claimed_by", user.id)
    .single();

  type PendingVerification = {
    id: string;
    session_date: string | null;
    session_time: string | null;
    session_location: string | null;
    is_verified: boolean;
    users: { full_name: string } | null;
  };

  let pendingVerifications: PendingVerification[] = [];

  if (instructorProfile) {
    const { data } = await db
      .from("reviews")
      .select(
        "id, session_date, session_time, session_location, is_verified, users!reviews_student_id_fkey (full_name)"
      )
      .eq("instructor_id", instructorProfile.id)
      .eq("is_verified", false)
      .eq("moderation_status", "approved")
      .order("session_date", { ascending: false });
    pendingVerifications = (data ?? []) as unknown as PendingVerification[];
  }

  const { data: myReviews } = await db
    .from("reviews")
    .select(
      "id, session_date, session_location, is_verified, rating_value, rating_effectiveness, rating_punctuality, instructors!reviews_instructor_id_fkey (full_name)"
    )
    .eq("student_id", user.id)
    .order("session_date", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Instructor verification panel */}
        {instructorProfile && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Pending Verifications</h2>
            <p className="text-sm text-slate-500 mb-4">
              Students are requesting you to verify these sessions.
            </p>

            {pendingVerifications.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 p-6 text-center">
                <p className="text-sm text-slate-400">No pending verification requests</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingVerifications.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        👤 {review.users?.full_name ?? "Student"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📅{" "}
                        {review.session_date
                          ? new Date(review.session_date).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                        {review.session_time && ` · 🕐 ${review.session_time}`}
                      </p>
                      {review.session_location && (
                        <p className="text-xs text-slate-500">📍 {review.session_location}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <VerifyButton reviewId={review.id} action="confirm" />
                      <VerifyButton reviewId={review.id} action="deny" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Student's review history */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">My Reviews</h2>
          <p className="text-sm text-slate-500 mb-4">
            Your submitted reviews and verification status.
          </p>

          {!myReviews || myReviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-6 text-center">
              <p className="text-sm text-slate-400 mb-3">
                You haven&apos;t written any reviews yet
              </p>
              <a
                href="/instructors"
                className="inline-block text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
                style={{ background: "#f97316" }}
              >
                Find an instructor to review →
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myReviews.map((review) => {
                const r = review as unknown as {
                  id: string;
                  session_date: string | null;
                  session_location: string | null;
                  is_verified: boolean;
                  rating_value: number;
                  rating_effectiveness: number;
                  rating_punctuality: number;
                  instructors: { full_name: string } | null;
                };
                const overall =
                  (r.rating_value + r.rating_effectiveness + r.rating_punctuality) / 3;
                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl p-4"
                    style={{
                      borderLeft: `4px solid ${r.is_verified ? "#22c55e" : "#94a3b8"}`,
                      borderTop: "1px solid #f1f5f9",
                      borderRight: "1px solid #f1f5f9",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {r.instructors?.full_name ?? "Unknown"}
                      </p>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: r.is_verified ? "#dcfce7" : "#f1f5f9",
                          color: r.is_verified ? "#16a34a" : "#64748b",
                        }}
                      >
                        {r.is_verified ? "✓ Verified" : "Pending verification"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {r.session_date &&
                        `📅 ${new Date(r.session_date).toLocaleDateString()}`}
                      {r.session_location && ` · 📍 ${r.session_location}`}
                    </p>
                    <p className="text-xs font-semibold mt-2" style={{ color: "#f97316" }}>
                      Overall: {overall.toFixed(1)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function VerifyButton({ reviewId, action }: { reviewId: string; action: "confirm" | "deny" }) {
  return (
    <form action={`/api/reviews/${reviewId}/verify`} method="POST">
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg text-sm font-semibold"
        style={
          action === "confirm"
            ? { background: "#22c55e", color: "white" }
            : { background: "#f1f5f9", color: "#475569" }
        }
      >
        {action === "confirm" ? "✓ Confirm" : "✗ Deny"}
      </button>
    </form>
  );
}
