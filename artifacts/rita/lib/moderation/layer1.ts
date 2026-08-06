/**
 * Layer 1 content moderation — regex/keyword-based pre-submit validation.
 * Layer 2 (AI-based classification for serious allegations) is a separate future feature.
 *
 * Works on both client (browser) and server (Node.js).
 * bad-words v4 ships its word list as a bundled JS array — no filesystem reads.
 */

// bad-words v4 sets module.exports.Filter = Filter so named import works at runtime.
// @types/bad-words uses `export =` syntax which conflicts with named import — suppress.
// @ts-ignore
import { Filter } from 'bad-words';

const profanityFilter = new Filter();

export interface ModerationResult {
  passed: boolean;
  blockers: string[];   // hard blocks — must fix before submitting
  warnings: string[];   // soft flags — logged but don't block submission
}

// 'block' = rejects submission. 'warn' = allowed through, but logged.
// Profanity is 'block' here (stricter than Yelp) because reviews target a
// named real person, not a generic business.
const SEVERITY: Record<string, 'block' | 'warn'> = {
  phone_number:   'block',
  email_address:  'block',
  street_address: 'block',
  profanity:      'block',
  promotional:    'warn',
  excessive_caps: 'warn',
  social_handle:  'warn',
};

const PHONE_REGEX    = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const EMAIL_REGEX    = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const ADDRESS_REGEX  = /\d{1,5}\s+\w+(\s+\w+){0,3}\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|way|blvd|boulevard)\b/i;
const SOCIAL_HANDLE_REGEX = /@[a-zA-Z0-9_]{3,}/;

// Promotional/spam patterns — students soliciting/advertising competing
// instruction, not related to reviewing the instructor being rated.
const PROMOTIONAL_PATTERNS = [
  /\b(dm|text|call|contact)\s+me\b/i,
  /\bcheck out\b.*\b(instagram|ig|website|\.com)\b/i,
  /\bbetter (coach|instructor|pro)\b.*\b(contact|call|dm)\b/i,
];

function checkExcessiveCaps(text: string): boolean {
  if (text.length < 20) return false;
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length === 0) return false;
  const capsRatio = (text.match(/[A-Z]/g) || []).length / letters.length;
  return capsRatio > 0.7;
}

export function checkReviewContentLayer1(text: string): ModerationResult {
  if (!text || !text.trim()) {
    return { passed: true, blockers: [], warnings: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  const checks: Array<[string, boolean]> = [
    ['phone_number',   PHONE_REGEX.test(text)],
    ['email_address',  EMAIL_REGEX.test(text)],
    ['street_address', ADDRESS_REGEX.test(text)],
    ['profanity',      (() => { try { return profanityFilter.isProfane(text); } catch { return false; } })()],
    ['promotional',    PROMOTIONAL_PATTERNS.some(p => p.test(text))],
    ['excessive_caps', checkExcessiveCaps(text)],
    ['social_handle',  SOCIAL_HANDLE_REGEX.test(text)],
  ];

  for (const [category, triggered] of checks) {
    if (!triggered) continue;
    if (SEVERITY[category] === 'block') blockers.push(category);
    else warnings.push(category);
  }

  return { passed: blockers.length === 0, blockers, warnings };
}

// ── User-facing message helpers ───────────────────────────────────────────────
// Keep messages generic — don't reveal which specific word/phrase triggered.

const BLOCKER_MESSAGES: Record<string, string> = {
  phone_number:   'Please remove phone numbers before submitting.',
  email_address:  'Please remove email addresses before submitting.',
  street_address: 'Please remove specific addresses before submitting.',
  profanity:      "This comment doesn't meet our content guidelines — please rephrase.",
};

export function blockerMessage(blockers: string[]): string {
  for (const b of blockers) {
    if (BLOCKER_MESSAGES[b]) return BLOCKER_MESSAGES[b];
  }
  return "Your comment contains content that cannot be submitted — please rephrase.";
}

export function warningMessage(warnings: string[]): string {
  const msgs: string[] = [];
  if (warnings.includes('excessive_caps')) {
    msgs.push('Your comment is mostly uppercase — consider using normal casing.');
  }
  if (warnings.includes('social_handle')) {
    msgs.push('Your comment includes a social media handle — make sure you\'re not sharing contact details.');
  }
  if (warnings.includes('promotional')) {
    msgs.push('Your comment may contain promotional content — keep reviews focused on your experience.');
  }
  return msgs.join(' ');
}
