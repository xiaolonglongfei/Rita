const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
const source = (file) => readFileSync(join(__dirname, "..", file), "utf8");
function load(file, deps = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, Date, URL, process: { env: {} }, console,
    require(name) { if (!(name in deps)) throw new Error(`Unexpected dependency ${name}`); return deps[name]; },
  });
  return module.exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));

function fixture({ signedIn = true, admin = true, logError = false, updateError = false, missing = false } = {}) {
  const writes = [];
  const route = load("app/api/moderation/[id]/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: signedIn ? { id: "admin" } : null } }) } }),
      createServiceClient: () => ({ from(table) {
        let operation = "read";
        const q = {
          select() { return q; }, eq() { return q; },
          update(data) { operation = "update"; writes.push([table, operation, plain(data)]); return q; },
          insert(data) { operation = "insert"; writes.push([table, operation, plain(data)]); return q; },
          delete() { operation = "delete"; writes.push([table, operation]); return q; },
          async single() { return table === "users" ? { data: { is_admin: admin } }
            : { data: logError ? null : { id: "log" }, error: logError ? { code: "23514" } : null }; },
          async maybeSingle() { return operation === "update"
            ? { data: updateError ? null : { id: "review" }, error: updateError ? { code: "failed" } : null }
            : { data: missing ? null : { id: "review", comment: "Original comment" }, error: null }; },
          then(resolve) { resolve({ error: operation === "update" && updateError ? { code: "failed" } : null }); },
        };
        return q;
      } }),
    },
  });
  return { writes, call: (body) => route.POST({ json: async () => body }, { params: Promise.resolve({ id: "review" }) }) };
}

test("comment-only removal logs first, saves note, and writes no rating/status/flag fields", async () => {
  const f = fixture();
  const result = await f.call({ action: "comment_removed", moderationNote: "  Personal information  " });
  assert.equal(result.status, 200);
  assert.deepEqual(f.writes, [
    ["moderation_log", "insert", { review_id: "review", action: "comment_removed", performed_by: "admin", performed_by_type: "admin", note: "Personal information" }],
    ["reviews", "update", { comment: null, moderation_note: "Personal information" }],
  ]);
});
test("audit rejection never removes a comment; update failure cleans up its audit entry", async () => {
  const rejected = fixture({ logError: true });
  assert.equal((await rejected.call({ action: "comment_removed" })).status, 500);
  assert.ok(!rejected.writes.some(([table]) => table === "reviews"));
  const failed = fixture({ updateError: true });
  assert.equal((await failed.call({ action: "comment_removed" })).status, 500);
  assert.deepEqual(failed.writes.at(-1), ["moderation_log", "delete"]);
});
test("approve/remove preserve status and flag behavior, adding notes without altering ratings/comments", async () => {
  for (const [action, status] of [["approve", "approved"], ["remove", "removed"]]) {
    const f = fixture();
    assert.equal((await f.call({ action, moderationNote: "Decision reason" })).status, 200);
    assert.deepEqual(f.writes[0], ["reviews", "update", {
      moderation_status: status, is_flagged: false, moderation_note: "Decision reason",
    }]);
    assert.equal(f.writes[1][2].action, status);
    assert.equal(f.writes[1][2].note, "Decision reason");
  }
});
test("moderation rejects unauthorized users, malformed actions/notes, and missing reviews", async () => {
  for (const [options, status] of [[{ signedIn: false }, 401], [{ admin: false }, 403], [{ missing: true }, 404]]) {
    const f = fixture(options);
    assert.equal((await f.call({ action: "comment_removed" })).status, status);
    assert.equal(f.writes.length, 0);
  }
  for (const body of [null, [], { action: "invalid" }, { action: "approve", moderationNote: 2 }, { action: "remove", moderationNote: "A".repeat(501) }]) {
    const f = fixture();
    assert.equal((await f.call(body)).status, 400);
    assert.equal(f.writes.length, 0);
  }
});
test("guidelines are indexable, canonical, and retain all nine headings and list structure", () => {
  const jsx = (type, props) => ({ type, props });
  const site = load("lib/site.ts");
  const page = load("app/guidelines/page.tsx", { "@/lib/site": site, "next/link": { default: "a" }, "react/jsx-runtime": { jsx, jsxs: jsx } });
  assert.equal(page.metadata.alternates.canonical, "https://www.rovi.training/guidelines");
  assert.equal(page.metadata.title, "Review Guidelines & Removal Policy");
  assert.equal(page.metadata.robots.index, true);
  function nodes(n) { return n && typeof n === "object" ? [n, ...[n.props?.children].flat(Infinity).flatMap(nodes)] : []; }
  const all = nodes(page.default());
  assert.equal(all.filter(n => n.type === "h2").length, 9);
  assert.equal(all.filter(n => n.type === "ul").length, 4);
  assert.equal(all.filter(n => n.type === "ol").length, 1);
  assert.equal(all.filter(n => n.type === "li").length, 22);
  const form = source("components/review/ReviewForm.tsx");
  assert.ok(form.includes("Ratings are all we need. Add a comment only if you&apos;d like to."));
  assert.ok(form.includes('placeholder="Share your experience... (optional)"'));
  assert.doesNotMatch(form.match(/<textarea[\s\S]*?\/>/)[0], /\brequired\b/);
  for (const file of ["components/shared/Footer.tsx", "components/review/ReviewForm.tsx", "app/(main)/instructor-info/page.tsx"]) {
    assert.ok(source(file).includes('href="/guidelines"'));
  }
  assert.equal(source("app/terms/page.tsx").match(/href="\/guidelines"/g).length, 2);
});
