const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadTs(relativePath, dependencies = {}) {
  const path = join(__dirname, "..", relativePath);
  const output = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: path,
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports, Date,
    require: (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: path });
  return module.exports;
}

const { getLocalSessionDefaults } = loadTs("lib/session-defaults.ts");
test("local defaults floor five minutes and respect midnight and DST", () => {
  const oldTZ = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    for (const [instant, date, time] of [
      ["2026-10-23T14:43:59Z", "2026-10-23", "10:40"],
      ["2026-10-23T04:02:59Z", "2026-10-23", "00:00"],
      ["2026-10-23T02:59:59Z", "2026-10-22", "22:55"],
      ["2026-11-01T05:43:00Z", "2026-11-01", "01:40"],
      ["2026-11-01T06:43:00Z", "2026-11-01", "01:40"],
      ["2026-11-01T15:43:00Z", "2026-11-01", "10:40"],
      ["2026-03-08T06:59:00Z", "2026-03-08", "01:55"],
      ["2026-03-08T07:01:00Z", "2026-03-08", "03:00"],
    ]) {
      const now = new Date(instant);
      const result = getLocalSessionDefaults(now);
      assert.equal(result.date, date);
      assert.equal(result.time, time);
      const [hours, minutes] = result.time.split(":").map(Number);
      assert.ok(hours * 60 + minutes <= now.getHours() * 60 + now.getMinutes());
    }
    process.env.TZ = "Asia/Tokyo";
    assert.equal(getLocalSessionDefaults(new Date("2026-10-23T15:43:00Z")).time, "00:40");
    assert.equal(getLocalSessionDefaults(new Date("2026-10-23T15:43:00Z")).date, "2026-10-24");
  } finally {
    if (oldTZ === undefined) delete process.env.TZ;
    else process.env.TZ = oldTZ;
  }
});

const reviewId = "11111111-1111-4111-8111-111111111111";
function fixture({ signedIn = true, owned = true, claimed = true, optedIn = true, count = 1, first = reviewId } = {}) {
  const filters = [];
  let dbCalls = 0;
  const jsx = (type, props) => ({ type, props });
  const page = loadTs("app/(main)/reviews/submitted/page.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { default: "a" },
    "lucide-react": { Check: "Check", EyeOff: "EyeOff", ShieldCheck: "ShieldCheck", Users: "Users" },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({
        data: { user: signedIn ? { id: "student-self", email: "private@example.test" } : null },
      }) } }),
      createServiceClient: () => ({
        from(table) {
          dbCalls++;
          const query = {
            select() { return query; },
            eq(column, value) { filters.push([table, column, value]); return query; },
            async maybeSingle() {
              return { data: table === "reviews"
                ? owned ? { id: reviewId, instructor_id: "coach-id" } : null
                : { full_name: "Example Coach", is_claimed: claimed }, error: null };
            },
          };
          return query;
        },
      }),
    },
    "@/lib/giveaway-progress": { getGiveawayProgress: async () => ({
      optedIn, qualifyingReviewCount: count, firstReview: first ? { id: first } : null,
    }) },
  }).default;
  return { page, filters, dbCalls: () => dbCalls };
}

function find(node, testId) {
  if (!node || typeof node !== "object") return null;
  if (node.props?.["data-testid"] === testId) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const result = find(child, testId);
    if (result) return result;
  }
  return null;
}
function text(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node !== "object") return String(node);
  return [node.props?.children].flat(Infinity).map(text).join("");
}
const render = (f, review = reviewId) => f.page({ searchParams: Promise.resolve({ review }) });

test("owned claimed review has persistent confirmation and exact private-session copy", async () => {
  const f = fixture();
  for (let i = 0; i < 2; i++) {
    const page = await render(f);
    assert.ok(find(page, "review-submitted"));
    assert.ok(find(page, "giveaway-entered-card"));
    assert.match(text(page), /We'll email you at private@example.test if you win\./);
    assert.ok(text(page).includes("Example Coach has been asked to confirm the session. They'll see your name, date, time and location, but never your rating or comments."));
    assert.equal(find(page, "button-review-another").props.href, "/instructors");
  }
  assert.ok(f.filters.some(([table, key, value]) => table === "reviews" && key === "student_id" && value === "student-self"));
  assert.ok(f.filters.some(([table, key, value]) => table === "reviews" && key === "id" && value === reviewId));
});

test("unclaimed confirmation does not imply a confirmation request was sent", async () => {
  const page = await render(fixture({ claimed: false }));
  assert.ok(text(page).includes("Your review is saved and marked 'pending verification' until Example Coach confirms the session."));
  assert.ok(!text(page).includes("has been asked"));
});

test("foreign reviews, unauthenticated visitors and invalid IDs show no details", async () => {
  for (const options of [{ owned: false }, { signedIn: false }]) {
    const f = fixture(options);
    const page = await render(f);
    assert.ok(find(page, "review-submitted-generic"));
    assert.ok(!text(page).includes("Example Coach"));
    assert.ok(!text(page).includes("private@example.test"));
    assert.ok(!find(page, "giveaway-entered-card"));
  }
  for (const review of [undefined, "", "not-a-uuid", [reviewId, reviewId]]) {
    const f = fixture();
    assert.ok(find(await f.page({ searchParams: Promise.resolve({ review }) }), "review-submitted-generic"));
    assert.equal(f.dbCalls(), 0);
  }
});

test("giveaway card requires opt-in, exactly one qualifying review, and this review", async () => {
  for (const options of [{ optedIn: false }, { count: 0 }, { count: 2 }, { first: "other-review" }]) {
    assert.ok(!find(await render(fixture(options)), "giveaway-entered-card"));
  }
});
