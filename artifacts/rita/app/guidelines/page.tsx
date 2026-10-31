import Link from "next/link";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(
  "/guidelines",
  "Review Guidelines & Removal Policy",
  "How to review instructors on Rovi, what comments may contain, and how review reports and removal requests are handled.",
  { index: true, follow: true },
);

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-12">
        <Link href="/" className="inline-block text-2xl font-black tracking-tight text-slate-800 hover:opacity-80">
          Rovi<span className="text-[#b8d400]">.</span>
        </Link>
        <header className="mt-8 border-b border-slate-200 pb-7">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Review Guidelines &amp; Removal Policy
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-500">Last updated: 10/31/2026</p>
        </header>
        <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">1. How reviewing works on Rovi</h2>
            <p>Ratings come first. Every Rovi review is built around three ratings: Value, Effectiveness and Punctuality. A written comment is optional. You can submit a review with only the ratings, and for most people that is all it takes. We built Rovi this way on purpose: it keeps reviewing quick, and it keeps feedback focused on the lesson experience rather than on personal remarks.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">2. Who can review</h2>
            <p>Review an instructor only if you (or your child) have taken a lesson with them. Enter the lesson date, time and place accurately. Please submit one review per lesson. Instructors, their family members, and people who compete with an instructor should not review that instructor.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">3. If you add a comment</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Describe your own experience in lessons: what happened, what helped, what did not.</li>
              <li>Do not include phone numbers, email addresses, street addresses or social media handles, yours or anyone else&apos;s.</li>
              <li>Do not name children or describe them in ways that could identify them. Say &quot;my son&quot; or &quot;my daughter&quot;.</li>
              <li>No threats, hate, discrimination, sexual content or insults.</li>
              <li>Do not present something as fact unless you know it is true. If it is your opinion, say so.</li>
              <li>Do not promote another coach, business or website.</li>
              <li>A review is not the place to report abuse, harassment or a safety concern. If anyone is in danger, call 911. Otherwise contact local law enforcement and the club or organization responsible for the program. Rovi cannot investigate those matters.</li>
            </ul>
            <p>Our system automatically blocks phone numbers, email addresses, street addresses and profanity, and warns about promotional language, all-capital text and social media handles.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">4. What we may remove</h2>
            <p>We may remove a comment, or an entire review, if it:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>breaks the rules in Section 3 (personal information, identifying a child, threats, hate, sexual content, promotion or spam);</li>
              <li>is not about a lesson the reviewer actually took, or the lesson details are clearly false;</li>
              <li>comes from the instructor, a relative, or a competitor, or is part of a duplicated or coordinated effort to raise or lower a rating;</li>
              <li>makes a specific factual claim that is clearly shown to be false (for example, describing a lesson that did not happen).</li>
            </ul>
            <p>If only the comment breaks the rules and the ratings reflect a genuine lesson, we may remove the comment and keep the ratings.</p>
            <p className="mt-3">What we do not remove: a review because its rating is low; honest criticism; a review because the instructor disagrees with the opinion; or a review because someone asked or paid.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">5. Instructors: how to report a review</h2>
            <p>If you are an instructor, or anyone else a review is about, email <a href="mailto:rovi.training.support@gmail.com" className="text-orange-600 underline underline-offset-2">rovi.training.support@gmail.com</a> with the subject &quot;Review report&quot;. Please tell us:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>your name and where you teach;</li>
              <li>which review you mean (the approximate date, or what it says);</li>
              <li>which guideline you think it breaks, and why;</li>
              <li>anything that supports your request (for example, that no lesson took place at that time and place).</li>
            </ul>
            <p>What happens next:</p>
            <ol className="list-decimal space-y-2 pl-6">
              <li>We aim to reply within 5 business days to confirm we received it and tell you what we will check.</li>
              <li>We check the review against these guidelines and the lesson details we have. If it appears to contain personal information, threats or hate, we may hide it while we look into it.</li>
              <li>We tell you our decision: remove the review, remove the comment only, or keep it, and which guideline we applied.</li>
              <li>If you have new information, reply and we will take another look. Rovi makes the final decision.</li>
            </ol>
            <p>We cannot tell you who wrote a review, and we do not remove a review just because it is critical. Submitting a request does not guarantee removal.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">6. If we contact a reviewer</h2>
            <p>We may email you if a report concerns your review, for example to ask you to confirm the lesson details. We do not share your identity with the instructor.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">7. What we promise</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>We never edit the words or the numbers in a review. We only remove (a whole review, or just the comment) or keep.</li>
              <li>No instructor, club, sponsor, advertiser or customer, now or in the future, can pay for or demand changes to ratings or the removal of a review. Everyone uses the process described here.</li>
              <li>Your rating and comments stay anonymous. Names are never shown with reviews or ratings. If an instructor has joined Rovi, they may be asked to confirm a lesson and will then see your name, the date, time and place, but never your rating or comments. We keep the link between your account and your review for moderation and legal compliance (see our <Link href="/privacy" className="text-orange-600 underline underline-offset-2">Privacy Policy</Link>).</li>
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">8. What &quot;Lesson confirmed&quot; means</h2>
            <p>When an instructor has joined Rovi, they can confirm that a lesson took place. A review marked &quot;Lesson confirmed&quot; has that confirmation. &quot;Not yet confirmed&quot; simply means the instructor has not confirmed it; it does not mean the review is false. Confirmation never changes a rating, and instructors never see ratings or comments when confirming.</p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-slate-900">9. Related terms</h2>
            <p>These guidelines supplement our <Link href="/terms" className="text-orange-600 underline underline-offset-2">Terms of Service</Link> (see Section 8 on reporting a review). If you believe content is unlawful, tell us in your report and we will review it. If we receive a valid legal order, we will follow it.</p>
          </section>
          <p>Questions: <a href="mailto:rovi.training.support@gmail.com" className="text-orange-600 underline underline-offset-2">rovi.training.support@gmail.com</a></p>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6">
          <Link href="/" className="text-sm font-bold text-orange-600 hover:underline">Back to Rovi</Link>
        </div>
      </article>
    </main>
  );
}
