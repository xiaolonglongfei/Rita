const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const root = join(__dirname, "..");
const read = file => readFileSync(join(root, file), "utf8");
function load(file, dependencies = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module, exports: module.exports, Request, URL,
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency ${name}`);
      return dependencies[name];
    },
  });
  return module.exports;
}
const publicReview = load("lib/public-review.ts");
const next = { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } };
const forbidden = /^(userId|userName|student_id|internal_notes|bio_source_url|claimed_by|created_by|opted_out_at|session_time|session_location|moderation_status|layer1_passed|is_flagged|edit_count)$/;
function assertSafe(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!forbidden.test(key), `Private field: ${key}`);
    assertSafe(child);
  }
}
const review = {
  id: "review-example", rating_value: 4, rating_effectiveness: 5, rating_punctuality: 3,
  comment: "Helpful lesson.", created_at: "2026-11-01T12:00:00Z", is_verified: true,
  student_id: "private", userId: "private", userName: "Private Person",
  session_time: "12:00", session_location: "private", moderation_status: "approved",
  layer1_passed: true, is_flagged: false, edit_count: 1,
};
function instructor(visible, extra = {}) {
  return {
    id: visible ? "visible-example" : "hidden-example", full_name: "Example Coach",
    name: "Example Coach", bio: null, avatar_url: null, photo_url: null,
    teaching_locations: "Example Club", location: "Example Club", specialty: "Tennis",
    is_claimed: false, verified: false, reviews_visible: visible,
    avg_overall: 4, avg_score: 4, avg_value: 4, avg_effectiveness: 5, avg_punctuality: 3,
    total_reviews: 10, review_count: 10, public_rank: 1, is_active: true, is_test: false,
    opted_out_at: null, internal_notes: "private", bio_source_url: "private",
    created_by: "private", claimed_by: "private", created_at: "2026-10-01T00:00:00Z",
    ...extra,
  };
}
function database(rows, reviews = [review]) {
  const calls = [];
  return {
    calls,
    from(table) {
      calls.push(["from", table]);
      let result = table === "reviews" ? [...reviews] : [...rows];
      const q = {
        select(...args) { calls.push(["select", table, ...args]); return q; },
        eq(key, value) { calls.push(["eq", key, value]); result = result.filter(r => r[key] === value); return q; },
        is(key, value) { calls.push(["is", key, value]); result = result.filter(r => r[key] === value); return q; },
        gte(key, value) { result = result.filter(r => r[key] >= value); return q; },
        gt(key, value) { result = result.filter(r => r[key] > value); return q; },
        order(...args) { calls.push(["order", ...args]); return q; },
        range() { return q; }, limit() { return q; },
        single: async () => ({ data: result[0] ?? null, error: null }),
        maybeSingle: async () => ({ data: result[0] ?? null, error: null }),
        then(resolve, reject) { return Promise.resolve({ data: result, count: result.length, error: null }).then(resolve, reject); },
      };
      return q;
    },
  };
}
const deps = db => ({
  "next/server": next, "@/lib/public-review": publicReview,
  "@/lib/supabase/server": { createServiceClient: () => db },
  "@/lib/instructor-creation": {}, "@/lib/moderation/layer1": {},
  "@/lib/instructor-bio-source": {}, "@/lib/bio-source-access": {},
});

test("public review allow-list strips identity and all extra properties", () => {
  const safe = publicReview.toPublicReview(review);
  assert.deepEqual(Object.keys(safe), publicReview.PUBLIC_REVIEW_FIELDS.split(", "));
  assertSafe(safe);
});

for (const visible of [false, true, null, undefined]) {
  test(`detail API strictly gates reviews and averages for reviews_visible=${visible}`, async () => {
    const row = instructor(visible);
    const db = database([row], [{ ...review, instructor_id: row.id }]);
    const route = load("app/api/instructors/[id]/route.ts", deps(db));
    const response = await route.GET(new Request("http://test"), { params: Promise.resolve({ id: row.id }) });
    assert.equal(response.status, 200);
    assertSafe(response.body);
    assert.equal(response.body.instructor.reviewCount, row.total_reviews);
    assert.equal(response.body.instructor.avgScore, visible === true ? 4 : null);
    assert.equal(response.body.instructor.avgValue, visible === true ? 4 : null);
    assert.equal(response.body.instructor.avgEffectiveness, visible === true ? 5 : null);
    assert.equal(response.body.instructor.avgPunctuality, visible === true ? 3 : null);
    assert.equal(response.body.reviews.length, visible === true ? 1 : 0);
    assert.equal(db.calls.some(c => c[0] === "from" && c[1] === "reviews"), visible === true);
    if (visible === true) {
      assert.deepEqual(Object.keys(response.body.reviews[0]), publicReview.PUBLIC_REVIEW_FIELDS.split(", "));
      assert.ok(db.calls.some(c => c[0] === "select" && c[1] === "reviews" && c[2] === publicReview.PUBLIC_REVIEW_FIELDS));
    }
  });
}

test("public rankings exclude hidden, inactive, removed and test records and preserve ordering", async () => {
  const db = database([
    instructor(true), instructor(false), instructor(null),
    instructor(true, { is_active: false }), instructor(true, { is_test: true }),
    instructor(true, { opted_out_at: "2026-01-01" }),
  ]);
  const response = await load("app/api/rankings/public/route.ts", deps(db)).GET(new Request("http://test"));
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].instructorId, "visible-example");
  assertSafe(response.body);
  assert.deepEqual(db.calls.filter(c => c[0] === "order").map(c => c[1]), ["avg_overall", "total_reviews"]);
});

test("browse hides averages and minScore never matches a hidden score, including zero filter", async () => {
  for (const filter of ["", "?minScore=0", "?minScore=3", "?minScore=5"]) {
    const db = database([instructor(false, { avg_overall: 5 }), instructor(true)]);
    const response = await load("app/api/instructors/route.ts", deps(db)).GET(new Request(`http://test/${filter}`));
    assertSafe(response.body);
    assert.equal(response.body.items.length, filter === "" ? 2 : filter === "?minScore=5" ? 0 : 1);
    if (filter === "") assert.equal(response.body.items[0].avgScore, null);
    else assert.ok(response.body.items.every(i => i.reviewsVisible === true));
  }
});

function legacyRoutes(file, db) {
  const routes = {};
  const router = { get(path, ...handlers) { routes[path] = handlers.at(-1); } };
  load(file, {
    express: { Router: () => router }, "@workspace/db": { supabase: db },
    "@workspace/api-zod": { ListInstructorsQueryParams: { safeParse: query => ({ success: true, data: query }) } },
    "../lib/auth": {},
  });
  return routes;
}
async function invoke(handler, query = {}) {
  const res = { body: null, code: 200, json(body) { res.body = body; }, status(code) { res.code = code; return res; } };
  await handler({ params: { id: "1" }, query }, res);
  assertSafe(res.body);
  return res.body;
}
test("legacy public detail, reviews, stats and browse also enforce visibility", async () => {
  for (const visible of [false, true]) {
    const db = database([instructor(visible, { id: 1 })], [{
      ...review, instructor_id: 1, status: "approved", value: 4, effectiveness: 5, punctuality: 3, overall_score: 4,
    }]);
    const routes = legacyRoutes("../api-server/src/routes/instructors.ts", db);
    assert.equal((await invoke(routes["/instructors/:id"])).avgScore, visible ? 4 : null);
    const reviews = await invoke(routes["/instructors/:id/reviews"]);
    assert.equal(reviews.items.length, visible ? 1 : 0);
    if (visible) assert.deepEqual(Object.keys(reviews.items[0]), publicReview.PUBLIC_REVIEW_FIELDS.split(", "));
    const stats = await invoke(routes["/instructors/:id/stats"]);
    assert.equal(stats.avgScore, visible ? 4 : null);
    assert.equal(stats.scoreDistribution.length, visible ? 5 : 0);
    const browse = await invoke(routes["/instructors"], { minScore: 0 });
    assert.equal(browse.items.length, visible ? 1 : 0);
  }
});
test("legacy public rankings use all directory privacy exclusions", async () => {
  const db = database([instructor(true), instructor(false), instructor(true, { is_test: true }),
    instructor(true, { is_active: false }), instructor(true, { opted_out_at: "removed" })]);
  const routes = legacyRoutes("../api-server/src/routes/rankings.ts", db);
  assert.equal((await invoke(routes["/rankings/public"])).length, 1);
});

test("profile uses the same review allow-list without changing review rendering", () => {
  const page = read("app/(main)/instructors/[id]/page.tsx");
  assert.ok(page.includes(".select(PUBLIC_REVIEW_FIELDS)"));
  assert.ok(page.includes(".map(toPublicReview)"));
  assert.ok(!page.includes("student_id"));
  assert.ok(page.includes("<ReviewCard key={review.id} review={review} />"));
  for (const field of ["avg_value", "avg_effectiveness", "avg_punctuality"])
    assert.ok(page.includes(`reviewsVisible ? instructor.${field} ?? 0 : null`));
});

test("published review markup is identical before and after the allow-list", () => {
  const localRequire = require("node:module").createRequire(join(root, "package.json"));
  const React = localRequire("react");
  const { renderToStaticMarkup } = localRequire("react-dom/server");
  const utils = load("lib/utils.ts", {
    clsx: localRequire("clsx"), "tailwind-merge": localRequire("tailwind-merge"),
  });
  const { ReviewCard } = load("components/review/ReviewCard.tsx", {
    "react/jsx-runtime": localRequire("react/jsx-runtime"), "@/lib/utils": utils,
  });
  for (const is_verified of [false, true]) {
    for (const comment of [null, "", "Helpful lesson."]) {
      const original = { ...review, is_verified, comment };
      const render = data => renderToStaticMarkup(React.createElement(ReviewCard, { review: data }));
      assert.equal(render(original), render(publicReview.toPublicReview(original)));
    }
  }
});
