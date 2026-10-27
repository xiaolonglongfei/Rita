import type { Metadata } from "next";
import Link from "next/link";
import { Check, EyeOff, ShieldCheck, Users } from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getGiveawayProgress } from "@/lib/giveaway-progress";
import { GIVEAWAY_MAX_ENTRIES } from "@/lib/giveaway";
import { privatePageMetadata } from "@/lib/site";

export const metadata: Metadata = privatePageMetadata("/reviews/submitted", "Review submitted", "Thanks for reviewing your coach on Rovi.");

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Details = {
  reviewId: string;
  instructorId: string;
  name: string;
  isClaimed: boolean;
  email: string | null;
  showGiveaway: boolean;
  qualifyingReviewCount: number;
};

async function loadDetails(reviewParam: unknown): Promise<Details | null> {
  const reviewId = typeof reviewParam === "string" ? reviewParam : null;
  if (!reviewId || !UUID_RE.test(reviewId)) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const db = createServiceClient();
    const { data: review, error } = await db
      .from("reviews")
      .select("id, instructor_id")
      .eq("id", reviewId)
      .eq("student_id", user.id)
      .maybeSingle();
    if (error || !review) return null;

    const { data: instructor } = await db
      .from("instructors")
      .select("full_name, is_claimed")
      .eq("id", review.instructor_id)
      .maybeSingle();

    let showGiveaway = false;
    let qualifyingReviewCount = 0;
    try {
      const progress = await getGiveawayProgress(user.id);
      showGiveaway = progress.optedIn;
      qualifyingReviewCount = progress.qualifyingReviewCount;
    } catch {
      showGiveaway = false;
    }

    return {
      reviewId: review.id,
      instructorId: review.instructor_id,
      name: instructor?.full_name?.trim() || "your coach",
      isClaimed: Boolean(instructor?.is_claimed),
      email: user.email ?? null,
      showGiveaway,
      qualifyingReviewCount,
    };
  } catch {
    return null;
  }
}

function CheckCircle() {
  return (
    <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-rita-lime-light text-rita-secondary ring-1 ring-rita-lime">
      <Check className="h-8 w-8" strokeWidth={3} aria-hidden="true" />
    </div>
  );
}

export default async function ReviewSubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const details = await loadDetails(params.review);

  if (!details) {
    return (
      <div className="mx-auto w-full max-w-md py-10" data-testid="review-submitted-generic">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <CheckCircle />
          <h1 className="mb-2 text-2xl font-black tracking-tight text-rita-secondary">Thanks</h1>
          <p className="text-base font-medium text-rita-secondary/90">
            Thanks for helping other students and parents choose a coach.
          </p>
          <Link
            href="/instructors"
            className="mt-6 block w-full rounded-lg bg-[#c2410c] px-6 py-3 text-center font-bold text-white hover:bg-[#9a3412]"
            data-testid="button-browse-coaches"
          >
            Browse coaches
          </Link>
        </div>
      </div>
    );
  }

  const { name, isClaimed, email, showGiveaway, qualifyingReviewCount, instructorId } = details;
  const maxReached = qualifyingReviewCount >= GIVEAWAY_MAX_ENTRIES;
  const giveawayHeading = maxReached
    ? "You've earned the maximum number of entries for this giveaway. Thank you!"
    : qualifyingReviewCount === 1
      ? "You're entered in the $100 gift card drawing!"
      : qualifyingReviewCount > 1
        ? "Another entry added to the $100 gift card drawing!"
        : null;

  return (
    <div className="mx-auto w-full max-w-md py-10" data-testid="review-submitted">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <CheckCircle />
          <h1 className="mb-2 text-2xl font-black tracking-tight text-rita-secondary">Review submitted</h1>
          <p className="text-base font-medium text-rita-secondary/90">
            Thanks for helping other students and parents choose a coach.
          </p>
        </div>

        {showGiveaway && (
          <div
            className="mt-6 rounded-xl border border-rita-lime bg-rita-lime-light p-4 text-rita-secondary"
            data-testid="giveaway-entered-card"
          >
            {giveawayHeading && <p className="font-bold">{giveawayHeading}</p>}
            {qualifyingReviewCount === 1 && <p className="mt-1 break-words text-sm">
              {email
                ? <>We&apos;ll email you at <span className="font-semibold">{email}</span> if you win.</>
                : <>We&apos;ll email you if you win.</>}
            </p>}
            {!maxReached && (
              <p className="mt-2 text-sm">
                Had lessons with another coach? Review them too, each review adds an entry.
              </p>
            )}
          </div>
        )}

        <section className="mt-8">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-rita-secondary">
            What happens next
          </h2>
          <ul className="space-y-4 text-sm text-rita-secondary">
            <li className="flex gap-3">
              <EyeOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Your rating and comments stay anonymous.</span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                {isClaimed
                  ? `${name} has been asked to confirm the session. They'll see your name, date, time and location, but never your rating or comments.`
                  : `Your review is saved and marked 'pending verification' until ${name} confirms the session.`}
              </span>
            </li>
            <li className="flex gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                Reviews appear on a coach&apos;s profile once enough have been collected, to protect reviewer privacy.
              </span>
            </li>
          </ul>
        </section>

        <Link
          href="/instructors"
          className="mt-8 block w-full rounded-lg bg-[#c2410c] px-6 py-3 text-center font-bold text-white hover:bg-[#9a3412]"
          data-testid="button-review-another"
        >
          Review another coach
        </Link>
        <p className="mt-2 text-center text-xs text-rita-secondary">
          Only review coaches you&apos;ve actually had a lesson with.
        </p>
        <div className="mt-4 text-center">
          <Link
            href={`/instructors/${instructorId}`}
            className="text-sm font-semibold text-rita-secondary underline underline-offset-2"
            data-testid="link-back-to-profile"
          >
            Back to {name}&apos;s profile
          </Link>
        </div>
      </div>
    </div>
  );
}
