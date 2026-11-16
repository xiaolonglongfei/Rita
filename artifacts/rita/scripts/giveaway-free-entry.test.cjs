const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = (file) => readFileSync(join(__dirname, "..", file), "utf8");
function load(file, deps = {}, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module, exports: module.exports, Date, Request, console, ...globals,
    require(name) { assert.ok(name in deps, `Unexpected dependency ${name}`); return deps[name]; },
  });
  return module.exports;
}
const giveaway = load("lib/giveaway.ts");
const free = load("lib/giveaway-free-entry.ts", { "server-only": {}, "node:crypto": require("node:crypto") });
const valid = { full_name: "Example Entrant", email: "example@example.test", confirmed_18_plus: true };
const defaultNow = "2026-11-16T12:00:00.000Z";
function fixture(options = {}) {
  let now = Date.parse(options.now ?? defaultNow);
  const records = options.records ?? [];
  const writes = [], calls = [];
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const db = { from(table) {
    assert.equal(table, "giveaway_free_entries", "The public endpoint must never touch users, reviews or instructors");
    let emailKey, start, end, payload;
    const q = {
      select(...args) { calls.push(["select", ...args]); return q; },
      eq(field, value) { assert.equal(field, "email_key"); emailKey = value; return q; },
      gte(field, value) { start = value; return q; },
      lt(field, value) { end = value; return q; },
      order() { return q; },
      async limit() {
        const matches = records.filter(r => r.email_key === emailKey && r.created_at >= start && r.created_at < end)
          .sort((a, b) => b.created_at.localeCompare(a.created_at));
        return { data: matches.slice(0, 1).map(r => ({ created_at: r.created_at })),
          count: options.nullCount ? null : matches.length, error: options.lookupError ? { code: "fail" } : null };
      },
      async insert(value) {
        payload = value; writes.push(payload);
        if (options.insertError) return { error: { code: options.insertError } };
        if (records.some(r => r.id === value.id)) return { error: { code: "23505" } };
        records.push(value);
        return { error: null };
      },
    };
    return q;
  } };
  const deps = {
    "next/server": { NextResponse: { json(body, options) {
      return { body, status: options?.status ?? 200, headers: options?.headers ?? {} };
    } } },
    "node:net": require("node:net"),
    "@/lib/supabase/server": { createServiceClient: () => db },
    "@/lib/giveaway": giveaway,
    "@/lib/giveaway-free-entry": free,
  };
  function server() {
    const route = load("app/api/giveaway/free-entry/route.ts", deps, { Date: Clock });
    assert.deepEqual(Object.keys(route).sort(), ["POST", "runtime"]);
    return async (body = valid, ip = "192.0.2.1", raw = false) => route.POST(new Request("http://test/api/giveaway/free-entry", {
      method: "POST", headers: { "x-real-ip": ip }, body: raw ? body : JSON.stringify(body),
    }));
  }
  return { submit: server(), server, records, writes, calls, setNow(value) { now = Date.parse(value); } };
}

test("normalization trims/case-folds email and collapses only gmail dots and plus tags", () => {
  for (const email of [" John.Smith+tennis@GMAIL.com ", "johnsmith@gmail.com", "JOHN.SMITH+other@gmail.com"]) {
    assert.equal(free.normalizeFreeEntryEmail(email), "johnsmith@gmail.com");
  }
  assert.equal(free.normalizeFreeEntryEmail(" A.B+tag@Example.com "), "a.b+tag@example.com");
  assert.equal(free.normalizeFreeEntryEmail(" A.B+tag@googlemail.com "), "a.b+tag@googlemail.com");
  assert.equal(free.freeEntrySlotId("johnsmith@gmail.com", "start", 1), free.freeEntrySlotId("johnsmith@gmail.com", "start", 1));
  assert.notEqual(free.freeEntrySlotId("johnsmith@gmail.com", "start", 1), free.freeEntrySlotId("johnsmith@gmail.com", "start", 2));
});

test("validation rejects malformed JSON, bad names, invalid email and non-boolean age/rules confirmation", async () => {
  const cases = [null, [], {}, { ...valid, full_name: "A" }, { ...valid, full_name: "A".repeat(81) },
    { ...valid, full_name: 42 }, { ...valid, email: "bad" }, { ...valid, email: "two@@example.com" },
    { ...valid, email: "a@example..com" }, { ...valid, email: "a@ example.com" },
    { ...valid, email: ".+tag@gmail.com" }, { ...valid, confirmed_18_plus: false },
    { ...valid, confirmed_18_plus: "true" }, { ...valid, confirmed_18_plus: 1 }];
  for (const body of cases) {
    const f = fixture();
    assert.equal((await f.submit(body)).status, 400, JSON.stringify(body));
    assert.equal(f.writes.length, 0);
  }
  assert.equal((await fixture().submit("not-json", "192.0.2.1", true)).status, 400);
  for (const full_name of ["Al", "A".repeat(80)]) assert.equal((await fixture().submit({ ...valid, full_name })).status, 201);
});

test("new entry is server-owned, isolated from accounts, and response exposes no stored row", async () => {
  const f = fixture();
  const result = await f.submit({ ...valid, full_name: " Example Entrant ", email: " John.Smith+tag@GMAIL.com ",
    email_key: "forged", id: "forged", created_at: "1900-01-01", user_id: "someone" });
  assert.equal(result.status, 201);
  assert.equal(result.body.free_entries_used, 1);
  assert.equal(result.body.message, "Your entry is recorded. You have used 1 of 3 free entries for this promotion.");
  assert.deepEqual(Object.keys(result.body).sort(), ["free_entries_used", "message"]);
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.equal(f.records[0].email_key, "johnsmith@gmail.com");
  assert.equal(f.records[0].full_name, "Example Entrant");
  assert.equal(f.records[0].confirmed_18_plus, true);
  assert.equal(f.records[0].created_at, defaultNow);
  assert.ok(!("user_id" in f.records[0]));
  assert.ok(f.records[0].id !== "forged");
});

test("seven-day gate, gmail alias gate, third-entry cap and promotion boundaries preserve existing records", async () => {
  const f = fixture();
  assert.equal((await f.submit(valid)).status, 201);
  const first = JSON.stringify(f.records[0]);
  f.setNow("2026-11-23T11:59:59.999Z");
  assert.equal((await f.submit(valid)).status, 429);
  f.setNow("2026-11-23T12:00:00.000Z");
  assert.equal((await f.submit(valid)).body.free_entries_used, 2);
  f.setNow("2026-11-30T12:00:00.000Z");
  assert.equal((await f.submit(valid)).body.free_entries_used, 3);
  f.setNow("2026-12-07T12:00:00.000Z");
  assert.equal((await f.submit(valid)).status, 429);
  assert.equal(f.records.length, 3);
  assert.equal(JSON.stringify(f.records[0]), first);
  const gmail = fixture();
  assert.equal((await gmail.submit({ ...valid, email: "John.Smith+one@gmail.com" })).status, 201);
  assert.equal((await gmail.submit({ ...valid, email: "johnsmith+two@gmail.com" })).status, 429);
  for (const [now, expected] of [
    ["2026-09-21T03:59:59.999Z", 400], ["2026-09-21T04:00:00.000Z", 201],
    ["2027-01-01T04:59:59.999Z", 201], ["2027-01-01T05:00:00.000Z", 400],
  ]) assert.equal((await fixture({ now }).submit()).status, expected);
});

test("independent server instances cannot create duplicate entry slots during a race", async () => {
  const f = fixture();
  const results = await Promise.all([f.submit(valid, "192.0.2.1"), f.server()(valid, "192.0.2.2")]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 429]);
  assert.equal(f.records.length, 1);
});

test("IP limiter counts invalid requests, separates addresses and resets after an hour", async () => {
  const f = fixture();
  for (let i = 0; i < 5; i++) assert.equal((await f.submit({})).status, 400);
  const limited = await f.submit({});
  assert.equal(limited.status, 429);
  assert.equal(limited.headers["Retry-After"], "3600");
  assert.equal((await f.submit({}, "192.0.2.2")).status, 400);
  f.setNow("2026-11-16T13:00:00.000Z");
  assert.equal((await f.submit({})).status, 400);
});

test("lookup and insert failures are explicit; no success is claimed when storage fails", async () => {
  for (const options of [{ lookupError: true }, { nullCount: true }, { insertError: "42501" }]) {
    const result = await fixture(options).submit();
    assert.equal(result.status, 503);
    assert.ok(result.body.error);
    assert.equal(result.body.free_entries_used, undefined);
  }
});

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return tree && typeof tree === "object" ? [tree, ...nodes(tree.props?.children)] : [];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join("");
  return tree && typeof tree === "object" ? text(tree.props?.children) : tree == null || typeof tree === "boolean" ? "" : String(tree);
}
function formHarness(fetch) {
  let cursor = 0;
  const state = [];
  const jsx = (type, props) => ({ type, props });
  const form = load("components/giveaway/FreeEntryForm.tsx", {
    "next/link": { default: "a" }, "react/jsx-runtime": { jsx, jsxs: jsx },
    react: { useState(initial) {
      const i = cursor++;
      if (!(i in state)) state[i] = initial;
      return [state[i], value => { state[i] = value; }];
    } },
  }, { fetch });
  return () => { cursor = 0; return form.FreeEntryForm(); };
}
test("actual free-entry form starts unchecked, sends only the three fields, and renders success or friendly errors", async () => {
  for (const success of [false, true]) {
    const requests = [];
    const render = formHarness(async (url, init) => {
      requests.push([url, JSON.parse(init.body)]);
      return { ok: success, json: async () => success ? { message: "Your entry is recorded. You have used 1 of 3 free entries for this promotion." } : { error: "Please wait seven days." } };
    });
    let tree = render();
    const inputs = nodes(tree).filter(n => n.type === "input");
    assert.equal(inputs.length, 3);
    assert.equal(inputs[2].props.checked, false);
    assert.equal(inputs[2].props.required, true);
    assert.equal(nodes(tree).find(n => n.type === "button").props.disabled, true);
    assert.ok(text(tree).includes("I am 18 or older and I have read the Official Rules."));
    inputs[0].props.onChange({ target: { value: "Example Entrant" } });
    inputs[1].props.onChange({ target: { value: "example@example.test" } });
    inputs[2].props.onChange({ target: { checked: true } });
    tree = render();
    await tree.props.onSubmit({ preventDefault() {} });
    tree = render();
    assert.equal(requests[0][0], "/api/giveaway/free-entry");
    assert.deepEqual(requests[0][1], valid);
    assert.ok(text(tree).includes(success ? "Your entry is recorded." : "Please wait seven days."));
    if (success) assert.equal(nodes(tree).filter(n => n.type === "input").length, 0);
  }
});

test("admin page rejects anonymous and non-admin visitors before any free-entry access", async () => {
  for (const signedIn of [false, true]) {
    const calls = [];
    const { default: page } = load("app/admin/giveaway/page.tsx", {
      "next/link": {}, "react/jsx-runtime": {},
      "next/navigation": { redirect(path) { throw new Error(`redirect:${path}`); } },
      "@/lib/giveaway-progress": { getGiveawayProgress() { throw Error("Not authorized"); } },
      "@/lib/supabase/server": {
        createClient: async () => ({ auth: { getUser: async () => ({ data: { user: signedIn ? { id: "member" } : null } }) } }),
        createServiceClient: () => ({ from(table) {
          calls.push(table);
          assert.equal(table, "users");
          const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { is_admin: false }, error: null }) };
          return q;
        } }),
      },
    });
    await assert.rejects(() => page({ searchParams: Promise.resolve({}) }), /redirect:/);
    assert.ok(!calls.includes("giveaway_free_entries"));
  }
});

test("admin renders read-only totals/table with the shared qualifying-review helper", async () => {
  const calls = [], helperCalls = [];
  const jsx = (type, props) => ({ type, props });
  const { default: page } = load("app/admin/giveaway/page.tsx", {
    "next/link": { default: "a" }, "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/navigation": { redirect() { throw Error("Unexpected redirect"); } },
    "@/lib/giveaway-progress": { getGiveawayProgress: async (id) => {
      helperCalls.push(id); return { qualifyingReviewCount: id === "qualified" ? 2 : 0 };
    } },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "admin" } } }) } }),
      createServiceClient: () => ({ from(table) {
        calls.push(table);
        const q = {
          select: () => q, eq: () => q, not: () => q, order: () => q,
          maybeSingle: async () => ({ data: { is_admin: true }, error: null }),
          range: async () => table === "users"
            ? { data: [{ id: "qualified" }, { id: "not-qualified" }], error: null }
            : { data: [{ id: "entry", full_name: "Private Entrant", email: "private@example.test", created_at: defaultNow }], count: 1, error: null },
        };
        return q;
      } }),
    },
  });
  const tree = await page({ searchParams: Promise.resolve({}) });
  assert.match(text(tree), /1 free entries/);
  assert.match(text(tree), /1 users with at least one qualifying review/);
  assert.ok(text(tree).includes("Private Entrant"));
  assert.ok(text(tree).includes("private@example.test"));
  assert.ok(!nodes(tree).some(n => n.type === "button" || n.type === "form"));
  assert.deepEqual(helperCalls, ["qualified", "not-qualified"]);
  assert.ok(calls.every(table => ["users", "giveaway_free_entries"].includes(table)));
});

test("required disclosures/links use one shared sentence and do not promote the free form elsewhere", () => {
  assert.equal(giveaway.GIVEAWAY_REVIEW_DISCLOSURE, "Reviewers are entered in a prize drawing. Entry does not depend on whether your review is positive or negative.");
  for (const file of ["app/win/page.tsx", "app/guidelines/page.tsx", "components/review/ReviewForm.tsx"]) {
    assert.ok(source(file).includes("{GIVEAWAY_REVIEW_DISCLOSURE}"));
  }
  for (const file of ["app/win/page.tsx", "components/review/ReviewForm.tsx"]) {
    assert.ok(source(file).includes('href="/rules"'));
    assert.ok(source(file).includes("No purchase necessary"));
  }
  for (const file of ["app/page.tsx", "app/win/page.tsx", "components/review/ReviewForm.tsx", "components/shared/Footer.tsx"]) {
    assert.ok(!source(file).includes("/win/free-entry"));
  }
  assert.ok(source("app/rules/page.tsx").includes('href="/win/free-entry"'));
  assert.ok(source("components/shared/Footer.tsx").includes('href="/rules"'));
  assert.ok(source("app/(main)/win/free-entry/page.tsx").includes("<FreeEntryForm"));
  assert.ok(!/signIn|auth\.|redirect\(/.test(source("app/(main)/win/free-entry/page.tsx")));
});
