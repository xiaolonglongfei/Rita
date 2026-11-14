const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, dependencies = {}) {
  const path = join(__dirname, "..", file);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    module, exports: module.exports, Date, Request, URL, console,
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency ${name}`);
      return dependencies[name];
    },
  });
  return module.exports;
}
const id = "11111111-1111-4111-8111-111111111111";
const next = { NextResponse: { json(body, init) { return { body, status: init?.status ?? 200 }; } } };
const auth = async () => ({ auth: { getUser: async () => ({ data: { user: { id: "student" } } }) } });

test("profile lookup filters removed instructors and treats them exactly like missing records", async () => {
  let optedOut = false;
  const calls = [];
  const query = {
    select() { return query; }, eq() { return query; },
    is(...args) { calls.push(args); return query; },
    async maybeSingle() { return { data: optedOut ? null : { id }, error: null }; },
  };
  const { getInstructorProfile } = load("lib/instructor-profile.ts", {
    "server-only": {}, react: { cache: fn => fn },
    "@/lib/supabase/server": { createServiceClient: () => ({ from: () => query }) },
  });
  assert.equal((await getInstructorProfile(id)).id, id);
  optedOut = true;
  assert.equal(await getInstructorProfile(id), null);
  assert.equal(await getInstructorProfile("invalid"), null);
  assert.deepEqual(calls, [["opted_out_at", null], ["opted_out_at", null]]);
});

test("detail API returns generic 404 before querying any removed coach's reviews", async () => {
  const calls = [];
  const q = {
    select() { return q; }, eq() { return q; },
    is(...args) { calls.push(args); return q; },
    async maybeSingle() { return { data: null, error: null }; },
  };
  const route = load("app/api/instructors/[id]/route.ts", {
    "next/server": next,
    "@/lib/supabase/server": { createServiceClient: () => ({ from(table) {
      assert.equal(table, "instructors"); return q;
    } }) },
  });
  const response = await route.GET(new Request("http://test"), { params: Promise.resolve({ id }) });
  assert.equal(response.status, 404);
  assert.equal(response.body.error, "Not found");
  assert.deepEqual(calls, [["opted_out_at", null]]);
});

test("review submission rejects removed coaches before moderation, user writes or review writes", async () => {
  const route = load("app/api/reviews/route.ts", {
    "next/server": next,
    "@/lib/supabase/server": { createClient: auth, createServiceClient() { throw Error("Unexpected database write"); } },
    "@/lib/instructor-profile": { getInstructorProfile: async () => null },
    "@/lib/resend": {},
    "@/lib/moderation/layer1": { checkReviewContentLayer1() { throw Error("Moderation must not run"); } },
  });
  const response = await route.POST(new Request("http://test", {
    method: "POST", body: JSON.stringify({ instructor_id: id, comment: "blocked text" }),
  }));
  assert.equal(response.status, 404);
  assert.equal(response.body.error, "Not found");
});

test("session submission rejects removed coaches without inserting sessions", async () => {
  const route = load("app/api/sessions/route.ts", {
    "next/server": next,
    "@/lib/supabase/server": { createClient: auth, createServiceClient: () => ({
      from() { throw Error("Session must not be written"); },
    }) },
    "@/lib/instructor-profile": { getInstructorProfile: async () => null },
  });
  assert.equal((await route.POST(new Request("http://test", {
    method: "POST", body: JSON.stringify({ instructorId: id }),
  }))).status, 404);
});

test("invalid private ranking is rejected before deleting any saved rankings", async () => {
  const calls = [];
  const q = {
    select() { return q; }, in() { return q; },
    async is(...args) { calls.push(args); return { data: [], error: null }; },
  };
  const route = load("app/api/rankings/private/route.ts", {
    "next/server": next,
    "@/lib/supabase/server": { createClient: auth, createServiceClient: () => ({
      from(table) { assert.equal(table, "instructors"); return q; },
    }) },
  });
  assert.equal((await route.PUT(new Request("http://test", { method: "PUT",
    body: JSON.stringify({ rankings: [{ instructor_id: id, rank_position: 1 }] }),
  }))).status, 404);
  assert.deepEqual(calls, [["opted_out_at", null]]);
});

test("giveaway progress excludes removed instructors with an inner join before counting", async () => {
  const filters = [];
  const fields = [];
  const q = {
    select(value) { fields.push(value); return q; },
    eq() { return q; }, filter() { return q; }, order() { return q; },
    is(...args) { filters.push(args); return q; },
    async maybeSingle() { return { data: { giveaway_opt_in_at: "2026-10-01" } }; },
    async limit() { return { data: [], count: 0, error: null }; },
  };
  const giveaway = load("lib/giveaway-progress.ts", {
    "server-only": {},
    "@/lib/supabase/server": { createServiceClient: () => ({ from: () => q }) },
    "@/lib/giveaway": { getGiveawayReviewFilters: () => [] },
  });
  const progress = await giveaway.getGiveawayProgress("student");
  assert.equal(progress.qualifyingReviewCount, 0);
  assert.equal(progress.firstReview, null);
  assert.ok(fields.some(value => value.includes("instructors!inner")));
  assert.deepEqual(filters, [["instructors.opted_out_at", null]]);
});

test("removed profiles are never indexable even with otherwise eligible flags", () => {
  const { isIndexableInstructor } = load("lib/instructor-seo.ts");
  assert.equal(isIndexableInstructor({
    is_active: true, is_test: false, reviews_visible: true, opted_out_at: new Date().toISOString(),
  }), false);
});

test("notification history hides removed names and linked reviews without deleting stored notifications", async () => {
  const records = [
    { id: "keep", message: "Welcome to Rovi" },
    { id: "name", message: "Your review for Removed Coach has been submitted." },
    { id: "coach", message: "Lesson request", related_instructor_id: id },
    { id: "review", message: "Lesson confirmed", related_review_id: "hidden-review" },
    { id: "visible", message: "Another lesson", related_review_id: "visible-review" },
  ];
  const route = load("app/api/notifications/route.ts", {
    "next/server": next,
    "@/lib/supabase/server": { createClient: auth, createServiceClient: () => ({
      from(table) {
        const q = {
          select() { return q; }, eq() { return q; }, not() { return q; },
          order() {
            return table === "notifications" ? Promise.resolve({ data: records }) : q;
          },
          async range() { return { data: [{ id, full_name: "Removed Coach" }] }; },
          async in() { return { data: [
            { id: "hidden-review", instructor_id: id },
            { id: "visible-review", instructor_id: "other-coach" },
          ] }; },
        };
        return q;
      },
    }) },
  });
  const response = await route.GET();
  assert.equal(response.status, 200);
  assert.deepEqual(Array.from(response.body, r => r.id), ["keep", "visible"]);
  assert.equal(records.length, 5);
});
