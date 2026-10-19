import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  GIVEAWAY_MAX_ENTRIES,
  getGiveawayReviewFilters,
  getGiveawayStatus,
} from "../lib/giveaway.ts";
import { sql } from "./giveaway-draw-sql.mjs";

const optInAt = "2026-10-19T12:00:00.000Z";
const cutoff = "2026-12-31T23:00:00.000Z";
function qualifies(review, optIn = optInAt, now = cutoff) {
  if (!optIn) return false;
  return getGiveawayReviewFilters(optIn, now).every(({ column, operator, value }) => {
    const actual = column === "created_at" ? Date.parse(review[column]) : review[column];
    const expected = column === "created_at" ? Date.parse(value) : value;
    return ({
      eq: () => actual === expected,
      gte: () => actual >= expected,
      lt: () => actual < expected,
      lte: () => actual <= expected,
    })[operator]();
  });
}
const review = {
  moderation_status: "approved",
  created_at: optInAt,
  is_verified: false,
};

test("saved/approved reviews qualify without instructor verification", () => {
  assert.equal(qualifies(review), true);
});
test("requires opt-in and creation at/after consent", () => {
  assert.equal(qualifies(review, null), false);
  assert.equal(qualifies({ ...review, created_at: "2026-10-19T11:59:59.999Z" }), false);
});
test("rejected or removed reviews never qualify", () => {
  for (const moderation_status of ["rejected", "removed", "pending"]) {
    assert.equal(qualifies({ ...review, moderation_status }), false);
  }
});
test("promotion start is inclusive and end is exclusive in New York time", () => {
  const earlyOptIn = "2026-09-01T00:00:00.000Z";
  const laterCutoff = "2027-01-02T00:00:00.000Z";
  for (const [created_at, expected] of [
    ["2026-09-21T03:59:59.999Z", false],
    ["2026-09-21T04:00:00.000Z", true],
    ["2027-01-01T04:59:59.999Z", true],
    ["2027-01-01T05:00:00.000Z", false],
  ]) {
    assert.equal(qualifies({ ...review, created_at }, earlyOptIn, laterCutoff), expected);
  }
});
test("drawing cutoff is inclusive and future submissions do not count", () => {
  assert.equal(qualifies({ ...review, created_at: cutoff }), true);
  assert.equal(qualifies({ ...review, created_at: "2026-12-31T23:00:00.001Z" }), false);
});
test("zero saved qualifying reviews means zero entries; total caps at four", () => {
  for (const count of [0, 1, 2, 3, 4, 5, 20]) {
    const accepted = Array.from({ length: count }, () => review).filter((r) => qualifies(r));
    assert.equal(Math.min(accepted.length, GIVEAWAY_MAX_ENTRIES), Math.min(count, 4));
  }
  assert.equal([].filter((r) => qualifies(r)).length, 0); // blocked attempts have no saved row
});
test("promotion statuses preserve boundary behavior", () => {
  assert.equal(getGiveawayStatus(new Date("2026-09-21T03:59:59.999Z")), "upcoming");
  assert.equal(getGiveawayStatus(new Date("2026-09-21T04:00:00.000Z")), "active");
  assert.equal(getGiveawayStatus(new Date("2027-01-01T05:00:00.000Z")), "ended");
});
test("committed draw SQL matches the shared UI definition exactly", () => {
  assert.equal(readFileSync(new URL("../supabase/queries/giveaway_entry_counts.sql", import.meta.url), "utf8"), sql);
  assert.match(sql, /HAVING COUNT\(q.review_id\) > 0/);
  assert.doesNotMatch(sql, /r\.is_verified/);
});
