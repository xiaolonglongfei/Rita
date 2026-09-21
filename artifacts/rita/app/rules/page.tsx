import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Official Giveaway Rules | Rovi",
  description: "Official rules for the Rovi $100 Gift Card Giveaway.",
};

const sections = [
  {
    title: "1. Sponsor",
    paragraphs: [
      <>This promotion (&quot;Giveaway&quot;) is sponsored by Rovi (rovi.training) (&quot;Sponsor&quot;). Contact: <a href="mailto:rovi.training.support@gmail.com" className="text-orange-600 underline underline-offset-2">rovi.training.support@gmail.com</a>.</>,
    ],
  },
  {
    title: "2. Eligibility",
    paragraphs: [
      "The Giveaway is open only to individuals who are (a) 18 years of age or older at the time of entry, and (b) legal residents of the United States. Employees of Sponsor and their immediate family members are not eligible. By entering, you represent that you meet these requirements. Sponsor reserves the right to request proof of age or residency before awarding a prize.",
    ],
  },
  {
    title: "3. Promotion Period",
    paragraphs: [
      <>This Giveaway runs from September 21, 2026 through December 31, 2026 (&quot;Promotion Period&quot;). Sponsor will conduct drawings periodically during the Promotion Period, at times and frequency determined at Sponsor&apos;s discretion; Sponsor is not obligated to hold drawings on a fixed schedule. The total value of all prizes awarded across the entire Promotion Period will not exceed $1,000.</>,
    ],
  },
  {
    title: "4. How to Enter",
    paragraphs: [
      "You may enter by creating a free Rovi account and completing the entry form linked from the Giveaway landing page during the Promotion Period. No purchase, payment, or review submission is required to enter or to receive a baseline entry. Limit one baseline entry per person, per drawing, per email address. Entries obtained through unauthorized or automated means will be void.",
    ],
  },
  {
    title: "5. Additional Entries",
    paragraphs: [
      "Entrants may earn additional entries by submitting reviews on Rovi that are (a) tied to a verified session, and (b) approved by Rovi's content moderation process during the Promotion Period. Additional entries are capped at a maximum regardless of how many qualifying reviews are submitted beyond that cap; submitting more reviews than the cap requires does not further increase your odds. The exact number of entries per qualifying review and the cap are set by Sponsor and may vary, and are not required to be disclosed in advertising materials for the Giveaway.",
    ],
  },
  {
    title: "6. Odds of Winning",
    paragraphs: [
      "Odds of winning depend on the total number of eligible entries received for that drawing.",
    ],
  },
  {
    title: "7. Prize",
    paragraphs: [
      "One (1) winner per drawing will receive a $100 gift card redeemable toward tennis equipment (\"Prize\"). Approximate retail value (ARV): $100. No cash substitution, except at Sponsor's sole discretion. Prize is non-transferable. The total value of all prizes awarded during the Promotion Period will not exceed $1,000.",
    ],
  },
  {
    title: "8. Winner Selection & Notification",
    paragraphs: [
      "The winner of each drawing will be selected in a random drawing from all eligible entries received by that drawing's entry cutoff date, weighted as described in Section 5. Sponsor will post each drawing's entry cutoff date on the entry page in advance. The potential winner will be notified via the email address associated with their Rovi account within 5 business days after that drawing's cutoff date. The potential winner must respond within 5 days of notification to claim the Prize; failure to respond, or failure to meet eligibility requirements, may result in disqualification and selection of an alternate winner.",
    ],
  },
  {
    title: "9. Taxes",
    paragraphs: [
      "The winner is solely responsible for any applicable federal, state, or local taxes associated with the Prize. If the total value of prizes awarded to a single individual by Sponsor within a calendar year is $600 or more, Sponsor may issue an IRS Form 1099 and may request tax identification information from the winner as a condition of receiving the Prize.",
    ],
  },
  {
    title: "10. Publicity",
    paragraphs: [
      "Except where prohibited, acceptance of the Prize constitutes the winner's consent to Sponsor's use of the winner's first name and general location (e.g., city or town) in connection with announcing the winner, without additional compensation.",
    ],
  },
  {
    title: "11. General Conditions",
    paragraphs: [
      "Sponsor reserves the right to disqualify any entrant found to be tampering with the entry process, violating these rules, or acting in an unsportsmanlike or disruptive manner. Sponsor reserves the right to cancel, suspend, or modify the Giveaway, or these rules, at any time, including if fraud, technical failures, or any other factor beyond Sponsor's reasonable control impairs the integrity of the Giveaway. Public review content associated with entrants remains anonymous on Rovi's platform as described in Rovi's standard review policies; this Giveaway's internal eligibility and winner-selection tracking is separate from, and does not affect, the anonymity of published reviews.",
    ],
  },
  {
    title: "12. Data Use",
    paragraphs: [
      <>By entering, you agree that Sponsor may use the contact information you provide to administer the Giveaway, including to notify you if you are selected as a winner and to arrange delivery of the Prize. Sponsor will not sell your entry information to third parties. See Rovi&apos;s <Link href="/privacy" className="text-orange-600 underline underline-offset-2">Privacy Policy</Link> for additional detail.</>,
    ],
  },
  {
    title: "13. Limitation of Liability",
    paragraphs: [
      "By entering, entrants agree to release and hold harmless Sponsor from any claims, injuries, losses, or damages of any kind arising from participation in the Giveaway or acceptance, use, or misuse of the Prize.",
    ],
  },
  {
    title: "14. Governing Law",
    paragraphs: [
      "This Giveaway and these rules are governed by the laws of the State of New York, without regard to conflict-of-law principles.",
    ],
  },
  {
    title: "15. Winner List",
    paragraphs: [
      <>For a list of winners or a copy of these rules, email <a href="mailto:rovi.training.support@gmail.com" className="text-orange-600 underline underline-offset-2">rovi.training.support@gmail.com</a>.</>,
    ],
  },
];

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-12">
        <Link
          href="/win"
          className="inline-block text-2xl font-black tracking-tight text-slate-800 hover:opacity-80"
          data-testid="link-rovi-giveaway"
        >
          Rovi<span className="text-[#b8d400]">.</span>
        </Link>

        <header className="mt-8 border-b border-slate-200 pb-7">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl" data-testid="rules-title">
            Rovi $100 Gift Card Giveaway — Official Rules
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-500">Last updated: 9/19/2026</p>
        </header>

        <p className="my-8 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm font-extrabold leading-relaxed text-slate-900 sm:text-base" data-testid="rules-no-purchase-notice">
          NO PURCHASE NECESSARY TO ENTER OR WIN. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING. Void where prohibited by law.
        </p>

        <div className="space-y-8 text-[15px] leading-7 text-slate-700 sm:text-base">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-xl font-bold text-slate-900">{section.title}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <Link
            href="/win"
            className="text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline"
            data-testid="link-back-to-giveaway"
          >
            Back to the giveaway
          </Link>
        </div>
      </article>
    </main>
  );
}