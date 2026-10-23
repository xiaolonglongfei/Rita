"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { GiveawayForm } from "./GiveawayForm";
import { GiveawayStatus } from "./GiveawayStatus";

export function GiveawayContent({ optedIn, entered }: { optedIn: boolean; entered: boolean }) {
  const [accountCreated, setAccountCreated] = useState(false);
  const hasAccount = optedIn || accountCreated;
  const steps = [
    "Sign up below",
    "Leave an anonymous review for your coach",
    "You're entered — winners drawn periodically",
  ];

  return (
    <>
      <div className="bg-rita-primary px-5 py-4 text-rita-secondary md:p-8">
        <h2 className="mb-2 text-sm font-black uppercase tracking-wide md:mb-5 md:text-lg" data-testid="steps-heading">
          How to enter:
        </h2>
        <ol className="space-y-2 text-sm font-semibold md:space-y-4 md:text-lg" data-testid="campaign-steps">
          {steps.map((label, index) => {
            const done = entered || (hasAccount && index === 0);
            const current = hasAccount && !entered && index === 1;
            return (
              <li key={label} aria-current={current ? "step" : undefined}
                className={`flex items-start gap-2 rounded-lg ${current ? "bg-white px-2 py-2" : ""} ${hasAccount && !done && !current ? "text-slate-700" : ""}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${done ? "bg-rita-lime-light" : current ? "bg-rita-secondary text-white" : "border border-current"}`}>
                  {done ? <Check aria-label="Completed" className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="min-w-0 leading-5">{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="p-5 md:p-8">
        {optedIn
          ? <GiveawayStatus entered={entered} />
          : <GiveawayForm onAccountCreated={() => setAccountCreated(true)} />}
      </div>
    </>
  );
}
