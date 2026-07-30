/**
 * Layer 1 content moderation — regex/keyword-based pre-submit validation.
 * Layer 2 (AI-based classification) is a separate future feature.
 *
 * Works on both client (browser) and server (Node.js).
 * bad-words ships its word list as a bundled JS array — no filesystem access needed.
 */

// @ts-ignore — @types/bad-words is typed for v3; v4 API is identical
import Filter from "bad-words";

export interface ModerationResult {
  passed: boolean;
  /** Hard blocks — must fix before submitting */
  blockers: Array<"phone_number" | "email_address" | "street_address" | "profanity">;
  /** Soft flags — shown but don't block submission */
  warnings: Array<"excessive_caps" | "social_handle">;
}

// Regex patterns (from spec)
const PHONE_RE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const ADDRESS_RE =
  /\d{1,5}\s+\w+(\s+\w+){0,3}\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|way|blvd|boulevard)\b/i;
const HANDLE_RE = /(@[a-zA-Z0-9_]{3,})/;

// Lazy-init the profanity filter (constructor is slightly expensive)
let _filter: InstanceType<typeof Filter> | null = null;
function getProfanityFilter() {
  if (!_filter) _filter = new Filter();
  return _filter;
}

export function checkReviewContentLayer1(text: string): ModerationResult {
  if (!text || !text.trim()) {
    return { passed: true, blockers: [], warnings: [] };
  }

  const blockers: ModerationResult["blockers"] = [];
  const warnings: ModerationResult["warnings"] = [];

  // ── Hard blocks ──────────────────────────────────────────────────────────

  if (PHONE_RE.test(text)) blockers.push("phone_number");
  if (EMAIL_RE.test(text)) blockers.push("email_address");
  if (ADDRESS_RE.test(text)) blockers.push("street_address");

  try {
    if (getProfanityFilter().isProfane(text)) blockers.push("profanity");
  } catch {
    // Never let a filter error block a submission — fail open
  }

  // ── Soft warnings ─────────────────────────────────────────────────────────

  // Excessive caps: comment > 20 chars and >70% of letters are uppercase
  if (text.length > 20) {
    const letters = text.replace(/[^a-zA-Z]/g, "");
    if (letters.length > 0) {
      const upperRatio = text.replace(/[^A-Z]/g, "").length / letters.length;
      if (upperRatio > 0.7) warnings.push("excessive_caps");
    }
  }

  // Social handle mention (soft — could be a legit club @account)
  if (HANDLE_RE.test(text)) warnings.push("social_handle");

  return { passed: blockers.length === 0, blockers, warnings };
}

// ── User-facing message helpers ──────────────────────────────────────────────
// Keep messages generic — don't reveal which word triggered profanity.

export function blockerMessage(blockers: ModerationResult["blockers"]): string {
  if (
    blockers.includes("phone_number") ||
    blockers.includes("email_address") ||
    blockers.includes("street_address")
  ) {
    return "Please remove personal contact information (phone numbers, email addresses, or street addresses) before submitting.";
  }
  if (blockers.includes("profanity")) {
    return "This comment doesn't meet our content guidelines — please rephrase.";
  }
  return "Your comment contains content that cannot be submitted — please rephrase.";
}

export function warningMessage(warnings: ModerationResult["warnings"]): string {
  const msgs: string[] = [];
  if (warnings.includes("excessive_caps")) {
    msgs.push("Your comment is mostly uppercase — consider using normal casing for readability.");
  }
  if (warnings.includes("social_handle")) {
    msgs.push("Your comment includes a social media handle — make sure you're not sharing contact details.");
  }
  return msgs.join(" ");
}
