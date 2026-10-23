import Link from "next/link";
import { Check } from "lucide-react";

export function GiveawayStatus({
  entered = false,
  emailConfirmationRequired = false,
}: {
  entered?: boolean;
  emailConfirmationRequired?: boolean;
}) {
  return (
    <div className="text-center py-10" data-testid={entered ? "status-entered" : "status-review-required"}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rita-lime-light text-rita-secondary ring-1 ring-rita-lime">
        <Check aria-hidden="true" className="h-8 w-8" />
      </div>
      <h3 className="text-2xl font-black text-rita-secondary mb-2 tracking-tight">
        {entered ? "You're entered!" : "Account created. One more step!"}
      </h3>
      {entered ? (
        <p className="text-rita-gray font-medium text-lg">We&apos;ll email you if you win.</p>
      ) : (
        <>
          <p className="text-rita-gray font-medium text-lg">
            {emailConfirmationRequired
              ? "Check your email to confirm your account, then come back and write your review to complete your entry."
              : "Leave a review for your tennis coach to complete your entry for the $100 gift card."}
          </p>
          {!emailConfirmationRequired && (
            <Link href="/instructors?review=true" className="mt-6 inline-block rounded-lg bg-rita-primary px-6 py-3 font-bold text-white">
              Write your review
            </Link>
          )}
          <p className="mt-4 text-xs leading-relaxed text-rita-gray">
            Prefer not to write a review?{" "}
            <Link href="/rules#how-to-enter" className="text-rita-primary underline">
              See the official rules for a free alternate way to enter.
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
