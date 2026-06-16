import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReviewForm } from "@/components/review/ReviewForm";

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ instructor_id?: string }>;
}) {
  const { instructor_id } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=/reviews/new${instructor_id ? `?instructor_id=${instructor_id}` : ""}`
    );
  }

  // Get student display name
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const studentName =
    userData?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Student";

  let instructor: { id: string; full_name: string } | null = null;
  if (instructor_id) {
    const { data } = await supabase
      .from("instructors")
      .select("id, full_name")
      .eq("id", instructor_id)
      .single();
    instructor = data;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {instructor && (
          <a
            href={`/instructors/${instructor.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            ← Back to {instructor.full_name}
          </a>
        )}

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Leave a Review</h1>
          <p className="text-sm text-slate-500 mt-1">
            Step 1: Confirm your session details · Step 2: Rate your instructor
          </p>
        </div>

        {instructor ? (
          <ReviewForm
            instructorId={instructor.id}
            instructorName={instructor.full_name}
            studentName={studentName}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
            <p className="text-slate-500 text-sm mb-4">
              Find the instructor you want to review:
            </p>
            <a
              href="/instructors"
              className="inline-block text-white font-semibold px-6 py-3 rounded-xl text-sm"
              style={{ background: "#f97316" }}
            >
              Browse Instructors →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
