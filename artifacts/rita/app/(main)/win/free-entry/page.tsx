import Link from "next/link";
import { getGiveawayStatus } from "@/lib/giveaway";
import { privatePageMetadata } from "@/lib/site";
import { FreeEntryForm } from "@/components/giveaway/FreeEntryForm";

export const dynamic = "force-dynamic";
export const metadata = privatePageMetadata("/win/free-entry", "Free giveaway entry", "Enter the Rovi giveaway without an account or a review.");

export default function FreeEntryPage() {
  const status = getGiveawayStatus();
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-slate-100 bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Free giveaway entry</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        No account, purchase, or review is required. Free entries have the same chance of winning as entries made with a review.
        Limit 3 free entries per person during the Promotion Period, no more than one every 7 days.
      </p>
      <p className="mt-3 text-sm text-slate-600">
        Open to legal residents of the United States aged 18 or older.{" "}
        <Link href="/rules" className="text-orange-600 underline underline-offset-2">Official Rules</Link>. No purchase necessary.
      </p>
      {status === "active" ? <FreeEntryForm /> : (
        <p role="status" className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          {status === "upcoming" ? "The giveaway hasn't started yet. Please come back during the Promotion Period." : "This giveaway has ended. We’re no longer accepting entries."}
        </p>
      )}
    </section>
  );
}
