const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, deps = {}, globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(readFileSync(join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, Date, Request, console, ...globals,
    require(name) { assert.ok(name in deps, `Unexpected import ${name}`); return deps[name]; } });
  return module.exports;
}
const creation = load("lib/instructor-creation.ts");
const response = { NextResponse: { json(body, init) { return { body, status: init?.status ?? 200 }; } } };
function fixture(options = {}) {
  const calls = [], inserts = [], logs = [];
  let count = options.count ?? 0;
  const db = { from(table) {
    let kind = "lookup", payload;
    const q = {
      select(fields, config) { calls.push([table, "select", fields]); if (config?.head) kind = "count"; return q; },
      eq(...args) { calls.push([table, "eq", ...args]); return q; },
      is(...args) { calls.push([table, "is", ...args]); return q; },
      order(...args) { calls.push([table, "order", ...args]); return q; },
      limit() { return q; },
      async gte(...args) { calls.push([table, "gte", ...args]); return { count, error: options.countError ? {} : null }; },
      insert(value) { payload = value; kind = "insert"; return q; },
      update(value) { payload = value; kind = "update"; return q; },
      async maybeSingle() {
        if (table === "users") return { data: { is_admin: !!options.admin }, error: options.roleError ? {} : null };
        if (kind === "update") { inserts.push(payload); return { data: options.notPending ? null : { id: "coach" }, error: null }; }
        return { data: options.existing ?? null, error: options.lookupError ? {} : null };
      },
      async single() { inserts.push(payload); count++; return { data: { id: "coach", ...payload }, error: null }; },
      then(resolve, reject) {
        if (table === "content_filter_logs") logs.push(payload);
        return Promise.resolve({ data: null, error: options.logError ? {} : null }).then(resolve, reject);
      },
    };
    return q;
  } };
  const deps = {
    "next/server": response,
    "@/lib/instructor-creation": creation,
    "@/lib/moderation/layer1": { checkReviewContentLayer1(text) {
      return { blockers: text.includes("blocked") ? ["profanity"] : [],
        warnings: text.includes("warned") ? ["promotional"] : [], passed: !text.includes("blocked") };
    } },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({
        data: { user: options.anonymous ? null : { id: "student" } },
      }) }, from() { throw Error("Duplicate lookup must not use the user-scoped client"); } }),
      createServiceClient: () => db,
    },
  };
  const route = load("app/api/instructors/route.ts", deps);
  return { calls, inserts, logs, deps, async submit(body = { full_name: "Example Coach" }) {
    return route.POST(new Request("http://test/api/instructors", { method: "POST",
      body: JSON.stringify({ confirmed_student: true, ...body }) }));
  } };
}

test("name keys collapse case, accents, spaces and punctuation without SQL wildcards", () => {
  for (const name of ["José O'Neil", "JOSE O.NEIL", " Jose-O’Neil ", "Jose_O%Neil"]) {
    assert.equal(creation.instructorNameKey(name.trim()), "joseoneil");
  }
});
test("student name and location validation rejects malformed input and enforces boundaries", async () => {
  for (const name of [null, 42, {}, "", "A", "A".repeat(81), "Coach 12", "Coach_Name", "Coach%Name", "--"]) {
    assert.equal((await fixture().submit({ full_name: name })).status, 400);
  }
  for (const name of ["Al", "A".repeat(80), "José O’Neil", "Jean-Luc P."]) {
    assert.equal(creation.studentInstructorValidation(name, "A".repeat(100)), null);
  }
  for (const location of ["A".repeat(101), 123, {}]) {
    assert.equal((await fixture().submit({ full_name: "Coach Name", teaching_locations: location })).status, 400);
  }
});
test("student-created instructors are hidden and ignore bio, about, photo and source overrides", async () => {
  const f = fixture();
  const result = await f.submit({ full_name: " José O'Neil ", teaching_locations: " Court ",
    bio: "Private bio", about: "About", photoUrl: "https://example.test/photo", created_by_source: "admin", is_active: true });
  assert.equal(result.status, 201);
  assert.equal(f.inserts[0].bio, null);
  assert.equal(f.inserts[0].avatar_url, null);
  assert.equal(f.inserts[0].is_active, false);
  assert.equal(f.inserts[0].created_by, "student");
  assert.equal(f.inserts[0].created_by_source, "student");
  assert.equal(f.inserts[0].teaching_locations, "Court");
  assert.ok(f.calls.some(c => c[1] === "eq" && c[2] === "name_key" && c[3] === "joseoneil"));
  assert.ok(f.calls.some(c => c[1] === "order" && c[2] === "opted_out_at" && c[3].nullsFirst === false));
});
test("service-role duplicate and opt-out checks return correct status and never insert", async () => {
  for (const [existing, status, message] of [
    [{ full_name: "Removed", is_active: true, opted_out_at: "2026-01-01" }, 404, "Not found"],
    [{ full_name: "Example Coach", is_active: true }, 409, 'An instructor named "Example Coach" already exists. Please search for them instead.'],
    [{ full_name: "Hidden Coach", is_active: false }, 409, "This coach can’t be added right now."],
  ]) {
    const f = fixture({ existing });
    const result = await f.submit();
    assert.equal(result.status, status); assert.equal(result.body.error, message); assert.equal(f.inserts.length, 0);
  }
  const f = fixture({ lookupError: true });
  assert.equal((await f.submit()).status, 500); assert.equal(f.inserts.length, 0);
});
test("rolling account limit allows three creations, rejects the fourth, and fails closed on count errors", async () => {
  const f = fixture();
  const results = await Promise.all([1, 2, 3, 4].map(() => f.submit()));
  assert.deepEqual(results.map(r => r.status), [201, 201, 201, 429]);
  assert.equal(f.inserts.length, 3);
  const cutoff = f.calls.find(c => c[1] === "gte")[3];
  assert.ok(Math.abs(Date.now() - new Date(cutoff).getTime() - 86400000) < 5000);
  assert.equal((await fixture({ countError: true }).submit()).status, 500);
});
test("Layer 1 blocks and logs both blockers and warnings for name and location, without creating an instructor", async () => {
  for (const body of [
    { full_name: "blocked Coach" }, { full_name: "warned Coach" },
    { full_name: "Example Coach", teaching_locations: "blocked Court" },
    { full_name: "Example Coach", teaching_locations: "warned Court" },
  ]) {
    const f = fixture();
    assert.equal((await f.submit(body)).status, 400);
    assert.equal(f.logs.length, 1); assert.equal(f.inserts.length, 0);
    assert.equal(f.logs[0].instructor_id, null); assert.equal(f.logs[0].attempted_by, "student");
    assert.ok(f.logs[0].blocked_categories.length || f.logs[0].warned_categories.length);
  }
  assert.equal((await fixture({ logError: true }).submit({ full_name: "blocked Coach" })).status, 500);
});
test("admins keep active creation and optional bio/photo without student limits", async () => {
  const f = fixture({ admin: true, count: 99 });
  assert.equal((await f.submit({ full_name: "Admin Coach", bio: "Bio", photoUrl: "photo" })).status, 201);
  assert.equal(f.inserts[0].is_active, true); assert.equal(f.inserts[0].created_by_source, "admin");
  assert.equal(f.inserts[0].bio, "Bio"); assert.equal(f.inserts[0].avatar_url, "photo");
  assert.equal((await fixture({ anonymous: true }).submit()).status, 401);
});
test("approval is admin-only and atomically restricted to pending, non-opted-out students", async () => {
  for (const admin of [false, true]) {
    const f = fixture({ admin });
    const route = load("app/api/admin/instructors/[id]/approve/route.ts", f.deps);
    const result = await route.POST(new Request("http://test", { method: "POST" }),
      { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) });
    assert.equal(result.status, admin ? 200 : 403);
    if (admin) {
      assert.equal(f.inserts[0].is_active, true);
      for (const [field, value] of [["created_by_source", "student"], ["is_active", false]]) {
        assert.ok(f.calls.some(c => c[1] === "eq" && c[2] === field && c[3] === value));
      }
      assert.ok(f.calls.some(c => c[1] === "is" && c[2] === "opted_out_at" && c[3] === null));
    } else assert.equal(f.inserts.length, 0);
  }
});

function uiHarness(file, deps = {}, globals = {}) {
  const states = [];
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const exports = load(file, {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    react: { Fragment: "fragment", useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    } }, ...deps,
  }, globals);
  return { render(props) { cursor = 0; return Object.values(exports)[0](props); } };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join("");
  if (tree == null || typeof tree === "boolean") return "";
  return typeof tree === "object" ? text(tree.props?.children) : String(tree);
}
test("student form requires lesson affirmation, sends it, and redirects to the new banner", async () => {
  const requests = [], redirects = [];
  const ui = uiHarness("components/instructor/AddInstructorForm.tsx", {
    "next/navigation": { useRouter: () => ({ push: url => redirects.push(url) }) },
  }, { fetch: async (url, init) => {
    requests.push([url, JSON.parse(init.body)]);
    return { ok: true, json: async () => ({ instructor: { id: "created-coach" } }) };
  } });
  let tree = ui.render();
  assert.ok(!text(tree).includes("About"));
  assert.equal(nodes(tree).filter(n => n.type === "textarea").length, 0);
  let inputs = nodes(tree).filter(n => n.type === "input");
  assert.equal(inputs[0].props.maxLength, 80); assert.equal(inputs[1].props.maxLength, 100);
  const checkbox = inputs.find(n => n.props.type === "checkbox");
  assert.equal(checkbox.props.checked, false);
  assert.equal(checkbox.props.required, true);
  assert.equal(nodes(tree).find(n => n.type === "button").props.disabled, true);
  inputs[0].props.onChange({ target: { value: " Coach Name " } });
  inputs[1].props.onChange({ target: { value: " Court " } });
  tree = ui.render();
  await nodes(tree).find(n => n.type === "button" && text(n) === "Add Instructor").props.onClick();
  assert.equal(requests.length, 0);
  checkbox.props.onChange({ target: { checked: true } });
  tree = ui.render();
  await nodes(tree).find(n => n.type === "button" && text(n) === "Add Instructor").props.onClick();
  assert.equal(requests[0][0], "/api/instructors");
  assert.deepEqual(requests[0][1], { full_name: "Coach Name", teaching_locations: "Court", created_by_source: "student", confirmed_student: true });
  assert.deepEqual(redirects, ["/instructors/created-coach?created=true"]);
});

test("non-admin creation requires the literal confirmed_student boolean; admins are exempt", async () => {
  for (const value of [undefined, null, false, "true", 1]) {
    const f = fixture();
    const result = await f.submit({ full_name: "Coach Name", confirmed_student: value });
    assert.equal(result.status, 400);
    assert.match(result.body.error, /taken lessons/);
    assert.equal(f.inserts.length, 0);
    assert.ok(!f.calls.some(call => call[0] === "instructors"));
  }
  assert.equal((await fixture({ admin: true }).submit({ full_name: "Coach Name", confirmed_student: false })).status, 201);
});

function visibilityFixture(options = {}) {
  const writes = [], tables = [], filters = [];
  const record = options.missing ? null : {
    id: "11111111-1111-4111-8111-111111111111",
    internal_notes: options.notes === undefined ? "Existing admin note" : options.notes,
    opted_out_at: options.restoring ? "2026-01-01T00:00:00.000Z" : null,
    is_active: !options.restoring,
  };
  const db = { from(table) {
    tables.push(table);
    let patch;
    const query = {
      select() { return query; },
      eq(...args) { filters.push(["eq", ...args]); return query; },
      is(...args) { filters.push(["is", ...args]); return query; },
      update(value) { patch = value; writes.push(value); return query; },
      async maybeSingle() {
        if (table === "users") return { data: { is_admin: options.admin !== false }, error: options.roleError ? {} : null };
        if (patch) return { data: options.conflict ? null : { ...record, ...patch }, error: options.writeError ? {} : null };
        return { data: record, error: options.readError ? {} : null };
      },
    };
    return query;
  } };
  const route = load("app/api/admin/instructors/[id]/visibility/route.ts", {
    "next/server": response,
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: options.anonymous ? null : { id: "admin" } } }) } }),
      createServiceClient: () => db,
    },
  });
  return { writes, tables, filters, submit(body, id = record?.id ?? "11111111-1111-4111-8111-111111111111") {
    return route.POST(new Request("http://test", { method: "POST", body: JSON.stringify(body) }),
      { params: Promise.resolve({ id }) });
  } };
}

test("visibility actions require server-admin authorization and valid inputs before writing", async () => {
  for (const [options, status] of [
    [{ anonymous: true }, 401], [{ admin: false }, 403], [{ roleError: true }, 500],
  ]) {
    const f = visibilityFixture(options);
    assert.equal((await f.submit({ action: "opt_out", reason: "Requested" })).status, status);
    assert.equal(f.writes.length, 0);
  }
  for (const body of [null, {}, { action: "delete" }, { action: "opt_out" }, { action: "opt_out", reason: "  " }]) {
    const f = visibilityFixture();
    assert.equal((await f.submit(body)).status, 400);
    assert.equal(f.writes.length, 0);
  }
  assert.equal((await visibilityFixture().submit({ action: "restore" }, "bad-id")).status, 404);
});

test("opt-out/restore append notes, update only visibility, and never access reviews", async () => {
  for (const restoring of [false, true]) {
    const f = visibilityFixture({ restoring });
    const result = await f.submit({ action: restoring ? "restore" : "opt_out", reason: " Requested by coach " });
    assert.equal(result.status, 200);
    assert.equal(f.writes.length, 1);
    const patch = f.writes[0];
    assert.deepEqual(Object.keys(patch).sort(), ["internal_notes", "is_active", "opted_out_at"]);
    assert.equal(patch.is_active, restoring);
    assert.equal(patch.opted_out_at === null, restoring);
    assert.match(patch.internal_notes, restoring
      ? /^Existing admin note\n\d{4}-\d\d-\d\dT.* restored$/
      : /^Existing admin note\n\d{4}-\d\d-\d\dT.* opted out: Requested by coach$/);
    assert.ok(f.tables.every(table => ["users", "instructors"].includes(table)));
    assert.ok(f.filters.some(filter => filter[1] === "internal_notes" && filter[2] === "Existing admin note"));
    assert.ok(f.filters.some(filter => filter[1] === "opted_out_at"));
    assert.ok(f.filters.some(filter => filter[1] === "is_active"));
  }
  const empty = visibilityFixture({ notes: null });
  assert.equal((await empty.submit({ action: "opt_out", reason: "Requested" })).status, 200);
  assert.ok(!empty.writes[0].internal_notes.startsWith("\n"));
});

test("visibility actions fail safely on missing rows, stale state, concurrent changes and database errors", async () => {
  for (const [options, action, status, writes] of [
    [{ missing: true }, "opt_out", 404, 0],
    [{ readError: true }, "opt_out", 500, 0],
    [{ restoring: true }, "opt_out", 409, 0],
    [{}, "restore", 409, 0],
    [{ conflict: true }, "opt_out", 409, 1],
    [{ writeError: true }, "opt_out", 500, 1],
  ]) {
    const f = visibilityFixture(options);
    assert.equal((await f.submit({ action, reason: "Requested" })).status, status);
    assert.equal(f.writes.length, writes);
  }
});

test("admin Opt out dialog requires a reason, updates row state, and Restore sends the correct action", async () => {
  const requests = [];
  const instructor = { id: "coach", full_name: "Coach Name", internal_notes: "Old note", opted_out_at: null, is_active: true };
  const ui = uiHarness("components/admin/InstructorAdminTable.tsx", {}, {
    fetch: async (url, init) => {
      const body = JSON.parse(init.body);
      requests.push([url, body]);
      const restoring = body.action === "restore";
      return { ok: true, json: async () => ({ instructor: {
        id: "coach", opted_out_at: restoring ? null : "2026-11-14", is_active: restoring,
        internal_notes: restoring ? "Old note\nopted out: Requested\nrestored" : "Old note\nopted out: Requested",
      } }) };
    },
  });
  const render = () => ui.render({ instructors: [instructor] });
  let tree = render();
  nodes(tree).find(n => n.type === "button" && text(n) === "Opt out").props.onClick({ stopPropagation() {} });
  tree = render();
  let dialog = nodes(tree).find(n => n.type === "dialog");
  assert.ok(dialog);
  assert.equal(nodes(dialog).find(n => n.type === "textarea").props.required, true);
  assert.equal(nodes(dialog).find(n => n.type === "button" && n.props.type === "submit").props.disabled, true);
  nodes(dialog).find(n => n.type === "textarea").props.onChange({ target: { value: "Requested" } });
  tree = render();
  await nodes(tree).find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  // onSubmit invokes an async handler; allow its response and state updates to settle.
  await new Promise(resolve => setImmediate(resolve));
  tree = render();
  assert.ok(!nodes(tree).some(n => n.type === "dialog"));
  assert.match(text(tree), /Opted out/);
  nodes(tree).find(n => n.type === "button" && text(n) === "Restore").props.onClick({ stopPropagation() {} });
  tree = render();
  assert.ok(!nodes(nodes(tree).find(n => n.type === "dialog")).some(n => n.type === "textarea"));
  await nodes(tree).find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  tree = render();
  assert.ok(nodes(tree).some(n => n.type === "button" && text(n) === "Opt out"));
  assert.deepEqual(requests, [
    ["/api/admin/instructors/coach/visibility", { action: "opt_out", reason: "Requested" }],
    ["/api/admin/instructors/coach/visibility", { action: "restore", reason: "" }],
  ]);
});
test("admin Pending filter excludes opted-out rows and Approve updates the visible list after success", async () => {
  const calls = [];
  const props = { instructors: [
    { id: "pending", full_name: "Pending Coach", created_by_source: "student", is_active: false, opted_out_at: null },
    { id: "removed", full_name: "Removed Coach", created_by_source: "student", is_active: false, opted_out_at: "2026-01-01" },
    { id: "admin", full_name: "Admin Coach", created_by_source: "admin", is_active: false, opted_out_at: null },
  ] };
  const ui = uiHarness("components/admin/InstructorAdminTable.tsx", {}, {
    fetch: async (url, init) => { calls.push([url, init.method]); return { ok: true }; },
  });
  let tree = ui.render(props);
  assert.ok(text(tree).includes("Opted out"));
  nodes(tree).find(n => n.type === "button" && text(n).startsWith("Pending (")).props.onClick();
  tree = ui.render(props);
  assert.ok(text(tree).includes("Pending Coach"));
  assert.ok(!text(tree).includes("Removed Coach")); assert.ok(!text(tree).includes("Admin Coach"));
  nodes(tree).find(n => n.type === "button" && text(n) === "Approve")
    .props.onClick({ stopPropagation() {} });
  await new Promise(resolve => setImmediate(resolve));
  tree = ui.render(props);
  assert.ok(text(tree).includes("No pending instructors."));
  assert.deepEqual(calls, [["/api/admin/instructors/pending/approve", "POST"]]);
});
