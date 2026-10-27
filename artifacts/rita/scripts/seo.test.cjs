const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadTs(file, dependencies = {}, env = {}) {
  const path = join(__dirname, "..", file);
  const output = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: path,
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports, Date, URL, process: { env },
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: path });
  return module.exports;
}
const site = loadTs("lib/site.ts");
const seo = loadTs("lib/instructor-seo.ts");

test("one www HTTPS origin and query-free absolute canonicals", () => {
  for (const env of [{}, { NEXT_PUBLIC_SITE_URL: "http://rovi.training/some/path?foo=1" }, { NEXT_PUBLIC_SITE_URL: "http://www.rovi.training/" }]) {
    const configured = loadTs("lib/site.ts", {}, env);
    assert.equal(configured.SITE_URL, "https://www.rovi.training");
    const metadata = configured.pageMetadata("/instructors?review=true#top", "Find a Tennis Instructor", "Description");
    assert.equal(metadata.alternates.canonical, "https://www.rovi.training/instructors");
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(metadata.openGraph.title, "Find a Tennis Instructor | Rovi");
    assert.equal(metadata.twitter.card, "summary_large_image");
    assert.equal(metadata.openGraph.images[0].width, 1280);
    assert.equal(metadata.twitter.images[0], "https://www.rovi.training/opengraph.jpg");
  }
});

test("profile indexing requires all three exact eligibility flags", () => {
  for (const is_active of [true, false, null]) {
    for (const is_test of [true, false, null]) {
      for (const reviews_visible of [true, false, null]) {
        assert.equal(seo.isIndexableInstructor({ is_active, is_test, reviews_visible }),
          is_active === true && is_test === false && reviews_visible === true);
      }
    }
  }
  assert.equal(seo.plainTextBio("<script>secret()</script><p>Coach &amp; teacher&#33;</p>"), "Coach & teacher!");
  assert.equal(seo.plainTextBio("A".repeat(200)).length, 150);
});

function profilePage(instructor) {
  const notFound = () => { throw new Error("NOT_FOUND"); };
  return loadTs("app/(main)/instructors/[id]/page.tsx", {
    "react/jsx-runtime": {},
    "@/lib/supabase/server": { createServiceClient() { throw new Error("Reviews must not be queried for hidden test pages."); } },
    "lucide-react": {},
    "next/navigation": { notFound },
    "@/components/shared/ScoreTriangle": {},
    "@/components/review/ReviewCard": {},
    "@/components/instructor/InstructorBadge": {},
    "@/lib/instructor-profile": { getInstructorProfile: async () => instructor },
    "@/lib/instructor-seo": seo,
    "@/lib/site": site,
  });
}
const coach = {
  id: "coach-id", full_name: "Example Coach", teaching_locations: "Example Club",
  is_active: true, is_test: false, reviews_visible: true,
  bio: "<p>Experienced tennis coach.</p>",
  avg_overall: 4.987, comment: "Private review text must never enter metadata.",
};
test("profile metadata is unique, plain text, canonical, and never contains review scores/text", async () => {
  for (const reviews_visible of [true, false]) {
    const metadata = await profilePage({ ...coach, reviews_visible }).generateMetadata({ params: Promise.resolve({ id: coach.id }) });
    assert.equal(metadata.title, "Example Coach — Tennis Instructor at Example Club");
    assert.equal(metadata.description, "Experienced tennis coach.");
    assert.equal(metadata.alternates.canonical, "https://www.rovi.training/instructors/coach-id");
    assert.equal(metadata.robots.index, reviews_visible);
    assert.equal(metadata.robots.follow, true);
    assert.ok(!JSON.stringify(metadata).includes(String(coach.avg_overall)));
    assert.ok(!JSON.stringify(metadata).includes(coach.comment));
  }
  const fallback = await profilePage({ ...coach, bio: null }).generateMetadata({ params: Promise.resolve({ id: coach.id }) });
  assert.equal(fallback.description, "Reviews and ratings for Example Coach, tennis instructor at Example Club.");
});
test("test profiles and unknown IDs return notFound before review rendering", async () => {
  for (const value of [null, { ...coach, is_test: true }]) {
    const page = profilePage(value);
    await assert.rejects(page.generateMetadata({ params: Promise.resolve({ id: coach.id }) }), /NOT_FOUND/);
    await assert.rejects(page.default({ params: Promise.resolve({ id: coach.id }), searchParams: Promise.resolve({}) }), /NOT_FOUND/);
  }
});

function database(rows) {
  const filters = [];
  const ranges = [];
  const client = {
    from() {
      const local = [];
      const query = {
        select() { return query; },
        eq(key, value) { filters.push([key, value]); local.push([key, value]); return query; },
        order() { return query; },
        async range(start, end) {
          ranges.push([start, end]);
          const filtered = rows.filter(row => local.every(([key, value]) => row[key] === value));
          return { data: filtered.slice(start, end + 1), count: filtered.length, error: null };
        },
      };
      return query;
    },
  };
  return { client, filters, ranges };
}
test("sitemap uses eligible profiles only, lastModified and all paginated rows", async () => {
  const rows = Array.from({ length: 1001 }, (_, index) => ({
    ...coach, id: String(index), updated_at: "2026-10-20T00:00:00Z",
  }));
  rows.push({ ...coach, id: "private", reviews_visible: false }, { ...coach, id: "test", is_test: true }, { ...coach, id: "inactive", is_active: false });
  const db = database(rows);
  const sitemap = loadTs("app/sitemap.ts", {
    "@/lib/site": site, "@/lib/supabase/server": { createServiceClient: () => db.client },
  }).default;
  const urls = await sitemap();
  assert.equal(urls.length, 1006);
  assert.ok(urls.every(({ url }) => url.startsWith("https://www.rovi.training/")));
  assert.equal(urls[5].lastModified, "2026-10-20T00:00:00Z");
  assert.ok(!urls.some(({ url }) => /\/(private|test|inactive)$/.test(url)));
  assert.deepEqual(db.ranges, [[0, 999], [1000, 1999]]);
});
test("server-rendered directory uses API privacy rules and serializes only safe fields", async () => {
  const db = database([
    { ...coach, id: "hidden", reviews_visible: false, avg_overall: 4.987, total_reviews: 2, is_claimed: false },
    { ...coach, id: "visible", avg_overall: 4.5, total_reviews: 3, is_claimed: true },
    { ...coach, id: "test", is_test: true }, { ...coach, id: "inactive", is_active: false },
  ]);
  const directory = loadTs("lib/instructor-directory.ts", {
    "server-only": {},
    "@/lib/supabase/server": { createServiceClient: () => db.client },
  });
  const result = await directory.getInitialInstructorPage();
  assert.equal(result.total, 2);
  assert.equal(result.items[0].avgScore, null);
  assert.equal(result.items[1].avgScore, 4.5);
  assert.ok(!JSON.stringify(result).includes("4.987"));
  assert.ok(!JSON.stringify(result).includes(coach.comment));
  assert.deepEqual(db.ranges, [[0, 49]]);
});
test("robots allow crawling noindex pages and reference www sitemap", () => {
  const robots = loadTs("app/robots.ts", { "@/lib/site": site }).default();
  assert.equal(robots.sitemap, "https://www.rovi.training/sitemap.xml");
  assert.equal(robots.rules.allow, "/");
  assert.equal(JSON.stringify(robots.rules.disallow), '["/api/","/admin"]');
});
test("debug page is disabled in production before loading authentication details", async () => {
  const page = loadTs("app/test-auth/page.tsx", {
    "react/jsx-runtime": {},
    "@/lib/supabase/server": { createClient() { throw new Error("Must not read auth"); } },
    "next/navigation": { notFound() { throw new Error("NOT_FOUND"); } },
  }, { NODE_ENV: "production" });
  await assert.rejects(page.default(), /NOT_FOUND/);
});
test("private metadata is noindex/nofollow without changing canonical routes", () => {
  for (const path of ["/win", "/login", "/signup", "/forgot-password", "/reset-password", "/profile", "/sessions", "/reviews/new", "/reviews/submitted", "/instructor-info", "/ranking", "/instructors/new"]) {
    const metadata = site.privatePageMetadata(`${path}?ignored=true`, "Private page");
    assert.equal(metadata.robots.index, false);
    assert.equal(metadata.robots.follow, false);
    assert.equal(metadata.alternates.canonical, `https://www.rovi.training${path}`);
  }
});
