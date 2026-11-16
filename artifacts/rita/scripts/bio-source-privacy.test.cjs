const assert = require("node:assert/strict");
const { readFileSync, readdirSync } = require("node:fs");
const { join, relative } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const root = join(__dirname, "..");
const read = file => readFileSync(join(root, file), "utf8");
const moduleResult = { exports: {} };
vm.runInNewContext(ts.transpileModule(read("lib/instructor-bio-source.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { module: moduleResult, exports: moduleResult.exports, URL, Date });
const { parseBioSource } = moduleResult.exports;

test("bio source validation accepts optional/cleared fields and rejects invalid URLs or dates", () => {
  for (const body of [{}, { bio_source_url: null, bio_source_checked_at: null }, {
    bio_source_url: " https://example.test/coach ", bio_source_checked_at: "2024-02-29",
  }]) assert.ok("values" in parseBioSource(body));
  const cleared = parseBioSource({ bio_source_url: "  ", bio_source_checked_at: "" });
  assert.equal(cleared.values.bio_source_url, null); assert.equal(cleared.values.bio_source_checked_at, null);
  for (const body of [
    { bio_source_url: "javascript:alert(1)" }, { bio_source_url: "/relative" },
    { bio_source_url: true }, { bio_source_url: "https://example.test/" + "a".repeat(2048) },
    { bio_source_checked_at: "2026-02-30" }, { bio_source_checked_at: "2026-13-01" },
    { bio_source_checked_at: "11/16/2026" }, { bio_source_checked_at: 123 },
  ]) assert.ok("error" in parseBioSource(body), JSON.stringify(body));
});

test("all public/member instructor projections are explicit and exclude private source fields", () => {
  function walk(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const file = join(dir, entry.name);
      return entry.isDirectory() ? walk(file) : /\.(ts|tsx)$/.test(file) ? [file] : [];
    });
  }
  const files = ["app", "lib", "components"].flatMap(dir => walk(join(root, dir)))
    .concat(walk(join(root, "../api-server/src")));
  let checked = 0;
  function tableOf(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      if (node.expression.name.text === "from" && ts.isStringLiteral(node.arguments[0])) return node.arguments[0].text;
      return tableOf(node.expression.expression);
    }
    return undefined;
  }
  for (const file of files) {
    const name = relative(root, file);
    if (/app\/admin\/|app\/api\/admin\/|components\/admin\/|routes\/admin\.ts$|^lib\/bio-source-access\.ts$/.test(name)) continue;
    const ast = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
          node.expression.name.text === "select") {
        const argument = node.arguments[0];
        const projection = argument && ts.isStringLiteral(argument) ? argument.text : null;
        if (tableOf(node.expression.expression) === "instructors") {
          checked++;
          assert.ok(projection && !projection.includes("*"), `${name}: instructor wildcard/implicit projection`);
          assert.ok(!/bio_source_url|bio_source_checked_at/.test(projection), `${name}: private source projection`);
        }
        if (projection) assert.ok(!/instructors(?:!inner)?\s*\([^)]*\*/.test(projection), `${name}: nested instructor wildcard`);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  assert.ok(checked >= 15);
});

test("source saving requires both browser roles to be denied column access and fails closed on errors", async () => {
  for (const [codes, expected] of [
    [["42501", "42501"], true], [[null, "42501"], false], [["42501", null], false],
    [["PGRST000", "42501"], false], [[null, null], false],
  ]) {
    const result = { exports: {} };
    const client = code => ({ from(table) {
      assert.equal(table, "instructors");
      const q = {
        select(fields, options) { assert.equal(options.head, true); assert.ok(fields.includes("bio_source_url")); return q; },
        limit: async () => ({ error: code ? { code } : null }),
      };
      return q;
    } });
    vm.runInNewContext(ts.transpileModule(read("lib/bio-source-access.ts"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText, { module: result, exports: result.exports,
      require(name) {
        if (name === "server-only") return {};
        assert.equal(name, "@/lib/supabase/server");
        return { createAnonymousClient: () => client(codes[0]), createClient: async () => client(codes[1]) };
      },
    });
    assert.equal(await result.exports.bioSourcePermissionsReady(), expected);
  }
});

test("new source details stay absent from public templates, metadata, sitemap and email", () => {
  for (const file of [
    "lib/resend.ts", "lib/site.ts", "app/sitemap.ts", "lib/club-pages.ts",
    "lib/instructor-profile.ts", "app/api/instructors/[id]/route.ts",
    "components/instructor/AddInstructorForm.tsx",
  ]) assert.ok(!/bio_source_url|bio_source_checked_at/.test(read(file)), file);
  const fields = read("components/admin/BioSourceFields.tsx");
  assert.ok(fields.includes('type="url"')); assert.ok(fields.includes('type="date"'));
  assert.ok(!fields.includes("required"));
});

test("parent guidance and privacy paragraphs are exact additions, not anonymity rewrites", () => {
  const decode = value => value.replaceAll("&apos;", "'").replace(/\s+/g, " ");
  assert.ok(decode(read("app/guidelines/page.tsx")).includes("Do not include a child's name or other personal details about a child. If you are a parent, rate the lesson, not the child."));
  assert.ok(decode(read("components/review/ReviewForm.tsx")).includes("Please don't include a child's name or personal details."));
  const privacy = decode(read("app/privacy/page.tsx"));
  assert.ok(privacy.includes("If an instructor has claimed their profile and confirms a lesson, they see the name on the student's account and the lesson date, time and place. They do not see the rating or comment. With few reviews, an instructor may be able to guess who wrote a review."));
  assert.ok(privacy.includes("If we receive a legal request to disclose the identity of a person who wrote a review, we will notify that person before disclosing where the law allows, unless we are legally prohibited from doing so."));
  assert.ok(privacy.includes("but this internal record is never disclosed publicly or to instructors."));
  assert.ok(read("app/guidelines/page.tsx").includes("We do not share your identity with the instructor."));
});
