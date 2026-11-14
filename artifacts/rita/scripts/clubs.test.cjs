const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, dependencies = {}, globals = {}) {
  const path = join(__dirname, "..", file);
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, URL, URLSearchParams, Date, process: { env: {} }, ...globals,
    require(name) { if (!(name in dependencies)) throw Error(`Unexpected import ${name}`); return dependencies[name]; },
  });
  return module.exports;
}
const club = { slug: "club-fit-jefferson-valley", name: "Club Fit", city: "Jefferson Valley",
  state: "NY", region: "westchester", teaching_location: "Club Fit, Jefferson Valley, NY", is_live: true };

test("club data queries live clubs only, limits public coach fields, and requires exact delimited segments", async () => {
  const calls = [];
  let locationFilter = "";
  const location = club.teaching_location;
  const candidates = [
    { id: "one", full_name: "Alpha Coach", teaching_locations: `${location} · Other Club, NY` },
    { id: "two", full_name: "Beta Coach", teaching_locations: `Other Club, NY · ${location} ` },
    { id: "three", full_name: "False substring", teaching_locations: `${location} Annex` },
    { id: "four", full_name: "Wrong case", teaching_locations: location.toLowerCase() },
    { id: "five", full_name: "No location", teaching_locations: null },
  ];
  const helpers = load("lib/club-pages.ts", {
    "server-only": {}, react: { cache: (fn) => fn },
    "@/lib/supabase/server": { createServiceClient: () => ({ from(table) {
      const q = {
        select(fields) { calls.push([table, "select", fields]); return q; },
        is(...args) { calls.push([table, ...args]); return q; },
        eq(...args) { calls.push([table, ...args]); return q; },
        ilike(field, value) { locationFilter = value; return q; },
        order(...args) { calls.push([table, "order", ...args]); return q; },
        async range() { return { data: candidates, error: null }; },
        async maybeSingle() { return { data: club, error: null }; },
      };
      return q;
    } }) },
  });
  assert.equal((await helpers.getLiveClub(club.slug)).slug, club.slug);
  assert.ok(calls.some(([table, col, value]) => table === "clubs" && col === "is_live" && value === true));
  const coaches = await helpers.getClubCoaches(location);
  assert.deepEqual(Array.from(coaches, c => c.id), ["one", "two"]);
  assert.equal(locationFilter, `%${location}%`);
  assert.ok(calls.some(([table, col, value]) => table === "instructors" && col === "is_active" && value === true));
  assert.ok(calls.some(([table, col, value]) => table === "instructors" && col === "is_test" && value === false));
  assert.ok(calls.some(([table, col, value]) => table === "instructors" && col === "opted_out_at" && value === null));
  assert.equal(calls.find(([table, op]) => table === "instructors" && op === "select")[2], "id, full_name, bio, teaching_locations");
  await helpers.getClubCoaches("Club_100% Tennis");
  assert.equal(locationFilter, "%Club\\_100\\% Tennis%");
});

test("club coach lookup retrieves all candidate pages and fails explicitly on database errors", async () => {
  const ranges = [];
  const row = { id: "coach", full_name: "Coach", teaching_locations: club.teaching_location };
  let fail = false;
  const helper = load("lib/club-pages.ts", {
    "server-only": {}, react: { cache: f => f },
    "@/lib/supabase/server": { createServiceClient: () => ({ from() {
      const q = { select() { return q; }, is() { return q; }, eq() { return q; }, ilike() { return q; }, order() { return q; },
        async range(start, end) { ranges.push([start, end]); return { data: start === 0 ? Array(1000).fill(row) : [row], error: fail ? {} : null }; } };
      return q;
    } }) },
  });
  assert.equal((await helper.getClubCoaches(club.teaching_location)).length, 1001);
  assert.deepEqual(ranges, [[0, 999], [1000, 1999]]);
  fail = true;
  await assert.rejects(helper.getClubCoaches(club.teaching_location), /Unable to load/);
});

test("source tracking uses URL before session storage and tolerates unavailable storage", () => {
  let stored = null;
  const window = { location: { search: "" }, sessionStorage: {
    getItem(key) { assert.equal(key, "rovi_club"); return stored; },
    setItem(key, value) { assert.equal(key, "rovi_club"); stored = value; },
  } };
  const source = load("lib/club-source.ts", {}, { window });
  assert.equal(source.getGiveawayClubSource(), undefined);
  source.rememberClubSource("saved-club");
  assert.equal(source.getGiveawayClubSource(), "saved-club");
  window.location.search = "?club=explicit-club";
  assert.equal(source.getGiveawayClubSource(), "explicit-club");
  window.location.search = "";
  window.sessionStorage.getItem = () => { throw Error("Storage blocked"); };
  assert.equal(source.getGiveawayClubSource(), undefined);
  window.sessionStorage.setItem = () => { throw Error("Storage blocked"); };
  assert.doesNotThrow(() => source.rememberClubSource("club"));
  assert.equal(load("lib/club-source.ts").getGiveawayClubSource(), undefined);
});

test("club routes have exact title, noindex/nofollow, hourly revalidation and 404 for missing/non-live clubs", async () => {
  let result = club;
  let coachCalls = 0;
  const site = load("lib/site.ts");
  const route = load("app/(main)/clubs/[slug]/page.tsx", {
    "next/navigation": { notFound() { throw Error("404"); } },
    "@/lib/club-pages": { getLiveClub: async () => result, getClubCoaches: async () => { coachCalls++; return []; } },
    "@/lib/site": site,
    "@/components/club/ClubPageContent": { ClubPageContent: "Content" },
    "@/components/club/ClubSource": { ClubSource: "Source" },
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
  });
  const input = { params: Promise.resolve({ slug: club.slug }) };
  assert.equal(route.revalidate, 3600);
  const metadata = await route.generateMetadata(input);
  assert.equal(metadata.title.absolute, "Club Fit, Jefferson Valley | Tennis coaches on Rovi");
  assert.equal(metadata.openGraph.title, metadata.title.absolute);
  assert.equal(metadata.robots.index, false);
  assert.equal(metadata.robots.follow, false);
  await route.default(input);
  assert.equal(coachCalls, 1);
  result = null;
  await assert.rejects(route.default(input), /404/);
  await assert.rejects(route.generateMetadata(input), /404/);
  assert.equal(coachCalls, 1);
});
