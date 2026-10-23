"use client";

import { useState } from "react";
import { giveawaySignupAction } from "@/app/(auth)/actions";
import Link from "next/link";
import { GiveawayStatus } from "./GiveawayStatus";
import { isGiveawayEmailValid, validateGiveawayNames, type GiveawayNameErrors } from "@/lib/giveaway-signup";

export function GiveawayForm({ onAccountCreated }: { onAccountCreated?: () => void } = {}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameTouched, setNameTouched] = useState({ firstName: false, lastName: false });
  const [serverNameErrors, setServerNameErrors] = useState<GiveawayNameErrors>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  const isPasswordValid = password.length >= 8;
  const nameValidation = validateGiveawayNames(firstName, lastName);
  const nameErrors = {
    firstName: serverNameErrors.firstName ?? (nameTouched.firstName ? nameValidation.fieldErrors.firstName : undefined),
    lastName: serverNameErrors.lastName ?? (nameTouched.lastName ? nameValidation.fieldErrors.lastName : undefined),
  };
  const canSubmit = nameValidation.valid && agreed && isPasswordValid && isGiveawayEmailValid(email) && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setServerNameErrors({});

    try {
      const result = await giveawaySignupAction(email, password, agreed, firstName, lastName);
      
      if (result?.fieldErrors) {
        setServerNameErrors(result.fieldErrors);
      } else if (result?.error) {
        setError(result.error);
      } else if (result?.accountCreated) {
        setEmailConfirmationRequired(result.emailConfirmationRequired);
        setAccountCreated(true);
        onAccountCreated?.();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (accountCreated) {
    return <GiveawayStatus emailConfirmationRequired={emailConfirmationRequired} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="giveaway-form">
      {error && (
        <div className="p-4 bg-score-low/10 border border-score-low/20 text-score-low rounded-lg text-sm font-semibold" data-testid="form-error">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-rita-secondary" htmlFor="first-name">
          First name
        </label>
        <input
          id="first-name"
          name="given-name"
          type="text"
          autoComplete="given-name"
          required
          maxLength={50}
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value);
            setServerNameErrors((current) => ({ ...current, firstName: undefined }));
          }}
          onBlur={() => setNameTouched((current) => ({ ...current, firstName: true }))}
          aria-invalid={!!nameErrors.firstName}
          aria-describedby={nameErrors.firstName ? "first-name-error" : undefined}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rita-primary focus:border-rita-primary transition-shadow bg-gray-50 focus:bg-white text-base"
          data-testid="input-first-name"
        />
        {nameErrors.firstName && (
          <p id="first-name-error" role="alert" className="text-xs text-score-low font-semibold">{nameErrors.firstName}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-rita-secondary" htmlFor="last-name">
          Last name
        </label>
        <input
          id="last-name"
          name="family-name"
          type="text"
          autoComplete="family-name"
          required
          maxLength={50}
          value={lastName}
          onChange={(e) => {
            setLastName(e.target.value);
            setServerNameErrors((current) => ({ ...current, lastName: undefined }));
          }}
          onBlur={() => setNameTouched((current) => ({ ...current, lastName: true }))}
          aria-invalid={!!nameErrors.lastName}
          aria-describedby={nameErrors.lastName ? "last-name-error" : undefined}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rita-primary focus:border-rita-primary transition-shadow bg-gray-50 focus:bg-white text-base"
          data-testid="input-last-name"
        />
        {nameErrors.lastName && (
          <p id="last-name-error" role="alert" className="text-xs text-score-low font-semibold">{nameErrors.lastName}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-rita-secondary" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rita-primary focus:border-rita-primary transition-shadow bg-gray-50 focus:bg-white text-base"
          data-testid="input-email"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-rita-secondary" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rita-primary focus:border-rita-primary transition-shadow bg-gray-50 focus:bg-white text-base"
          data-testid="input-password"
          placeholder="Min. 8 characters"
        />
        {password.length > 0 && !isPasswordValid && (
          <p className="text-xs text-score-low font-semibold mt-1 flex items-center">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Password must be at least 8 characters.
          </p>
        )}
      </div>

      <div className="flex items-start pt-2">
        <div className="flex items-center h-6">
          <input
            id="terms"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 accent-rita-primary text-rita-primary border-gray-300 rounded focus:ring-rita-primary focus:ring-offset-2 transition-all cursor-pointer"
            data-testid="checkbox-terms"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="terms" className="font-medium text-rita-secondary cursor-pointer leading-tight block pt-0.5">
            I agree to the{" "}
            <Link href="/rules" className="text-rita-primary font-bold hover:underline" data-testid="link-rules">
              Official Rules & Terms
            </Link>{" "}
            of this promotion
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-rita-primary hover:bg-rita-primary-dark text-white font-bold text-lg py-4 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] disabled:shadow-none hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-px active:translate-y-0"
        data-testid="submit-button"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </span>
        ) : (
          "Create Account & Enter to Win"
        )}
      </button>
    </form>
  );
}
