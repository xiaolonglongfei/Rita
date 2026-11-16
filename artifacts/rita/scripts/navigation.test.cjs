const assert = require("node:assert/strict");
const { readFileSync, readdirSync } = require("node:fs");
const { join, relative } = require("node:path");
const test = require("node:test");

const root = join(__dirname, "..", "app");
const read = (file) => readFileSync(join(root, file), "utf8");

test("contact reuses the main authenticated navbar and one root footer", () => {
  assert.match(read("contact/layout.tsx"), /export \{ default \} from "\.\.\/\(main\)\/layout"/);
  const main = read("(main)/layout.tsx");
  for (const prop of ["initialUser={user}", "instructorProfile={instructorProfile}", "pendingCount={pendingCount}"]) {
    assert.ok(main.includes(prop));
  }
  assert.equal((read("layout.tsx").match(/<Footer\s*\/>/g) || []).length, 1);
  const footer = readFileSync(join(root, "../components/shared/Footer.tsx"), "utf8");
  assert.match(footer, /href="\/contact"[^>]*>Contact us</);
  const page = read("contact/page.tsx");
  assert.ok(!page.includes("<main"));
  assert.ok(page.includes("Questions, corrections, or concerns about Rovi? Email us at"));
  assert.ok(page.includes('href="mailto:rovi.training.support@gmail.com"'));
  assert.ok(!/opt.out|removal|<form/i.test(page));
});

test("every standalone page has a home link or inherits standard navigation", () => {
  function pages(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? pages(path) : entry.name === "page.tsx" ? [relative(root, path)] : [];
    });
  }
  for (const page of pages(root)) {
    if (page.startsWith("(main)/") || page.startsWith("admin/") || page === "contact/page.tsx" || page === "page.tsx") continue;
    assert.match(read(page), /href=["']\/["']/, `${page} needs a way home`);
  }
  assert.match(read("(main)/layout.tsx"), /<Navbar/);
  assert.match(read("admin/layout.tsx"), /href="\/"/);
  assert.match(read("page.tsx"), /<Navbar/);
});

test("404 includes a home wordmark and an explicit Back to home link without instructor details", () => {
  const page = read("not-found.tsx");
  assert.equal((page.match(/href="\/"/g) || []).length, 2);
  assert.ok(page.includes("Back to home"));
  assert.ok(page.includes("Page not found"));
  assert.ok(!/supabase|instructor|opted_out/.test(page));
});

test("official rules wordmark returns home and the separate giveaway link stays intact", () => {
  const rules = read("rules/page.tsx");
  assert.match(rules, /href="\/"\s+className="inline-block text-2xl/);
  assert.match(rules, /href="\/win"[\s\S]*?Back to the giveaway/);
});
