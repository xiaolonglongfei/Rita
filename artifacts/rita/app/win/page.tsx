import { Metadata } from "next";
import { getGiveawayStatus } from "@/lib/giveaway";
import { GiveawayForm } from "./GiveawayForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Win a $100 Gift Card | Rovi",
  description: "Sign up and leave an anonymous review for your tennis coach to enter our $100 gift card giveaway.",
};

export default function WinPage() {
  const status = getGiveawayStatus();

  return (
    <div className="min-h-[100dvh] bg-rita-gray-light flex flex-col font-sans">
      {/* Header Band */}
      <header className="bg-rita-secondary text-white py-5 px-4 shadow-md sticky top-0 z-10 border-b-4 border-rita-lime" data-testid="campaign-header">
        <div className="max-w-md mx-auto flex flex-col items-center text-center">
          <Link href="/" className="inline-block focus:outline-none focus:ring-2 focus:ring-rita-lime rounded-sm">
            <div className="text-3xl font-black tracking-tight text-rita-lime mb-1 uppercase hover:opacity-90 transition-opacity" data-testid="rovi-wordmark">
              Rovi
            </div>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1" data-testid="campaign-headline">
            You could win a $100 gift card.
          </h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-100">
          
          {/* Steps */}
          <div className="p-6 md:p-8 bg-rita-primary text-white">
            <h2 className="text-lg font-black mb-5 tracking-wide uppercase text-white/90" data-testid="steps-heading">
              How to enter:
            </h2>
            <ul className="space-y-4 font-semibold text-lg" data-testid="campaign-steps">
              <li className="flex items-start">
                <span className="leading-tight">1. Sign up below with your email</span>
              </li>
              <li className="flex items-start">
                <span className="leading-tight">2. Leave an anonymous review for your coach</span>
              </li>
              <li className="flex items-start">
                <span className="leading-tight">3. You're entered — winners drawn periodically</span>
              </li>
            </ul>
          </div>

          {/* Form / Status Box */}
          <div className="p-6 md:p-8">
            {status === "upcoming" && (
              <div className="text-center py-10" data-testid="status-upcoming">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rita-primary-light text-rita-primary mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-rita-secondary mb-3">Coming Soon</h3>
                <p className="text-rita-gray font-medium text-lg leading-snug">
                  Our giveaway starts on September 21, 2026. Check back then to enter!
                </p>
              </div>
            )}
            
            {status === "ended" && (
              <div className="text-center py-10" data-testid="status-ended">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-rita-secondary mb-3">Promotion Ended</h3>
                <p className="text-rita-gray font-medium text-lg leading-snug">
                  This giveaway has concluded. Thank you to everyone who participated!
                </p>
              </div>
            )}

            {status === "active" && (
              <GiveawayForm />
            )}
          </div>
          
          {/* Small Print */}
          <div className="p-5 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-sm mx-auto" data-testid="campaign-smallprint">
              No purchase necessary. Must be 18+ and a legal resident of the United States. See official rules for details.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
