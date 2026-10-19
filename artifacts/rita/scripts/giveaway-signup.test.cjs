const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Execute the real server action with external services stubbed: no accounts or emails.
function loadTs(relativePath, dependencies = {}) {
  const path = join(__dirname, "..", relativePath);
  const output = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: path,
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports, URL, Date, process: { env: {} },
    require: (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: path });
  return module.exports;
}

const validation = loadTs("lib/giveaway-signup.ts");
function actionFixture({ status = "active", existing = false, authError = null, session = {} } = {}) {
  const calls = { auth: [], profiles: [], welcome: [] };
  const action = loadTs("app/(auth)/actions.ts", {
    "@supabase/ssr": {
      createServerClient: () => ({ auth: {
        signUp: async (input) => {
          calls.auth.push(input);
          return {
            data: { user: { id: "test-user", identities: existing ? [] : [{ id: "test-identity" }] }, session },
            error: authError,
          };
        },
      } }),
    },
    "next/headers": {
      cookies: async () => ({ getAll: () => [], set: () => {} }),
      headers: async () => new Map([["origin", "https://example.test"]]),
    },
    "next/navigation": { redirect: () => { throw new Error("Unexpected redirect"); } },
    "@/lib/supabase/server": {
      createServiceClient: () => ({
        from: (table) => ({
          upsert: async (profile) => {
            assert.equal(table, "users");
            calls.profiles.push(profile);
            return { error: null };
          },
        }),
      }),
    },
    "@/lib/resend": { sendWelcomeEmail: async (input) => { calls.welcome.push(input); } },
    "@/lib/giveaway": { getGiveawayStatus: () => status },
    "@/lib/giveaway-signup": validation,
  }).giveawaySignupAction;
  return { action, calls };
}

test("server rejects missing/whitespace/non-string names before Auth", async () => {
  for (const value of ["", "   ", undefined, null, 42]) {
    const { action, calls } = actionFixture();
    const result = await action("member@example.test", "password123", true, value, value);
    assert.equal(result.fieldErrors.firstName, "First name is required.");
    assert.equal(result.fieldErrors.lastName, "Last name is required.");
    assert.equal(calls.auth.length, 0);
    assert.equal(calls.profiles.length, 0);
  }
});
test("server gives field-specific 50-character limits", async () => {
  const { action, calls } = actionFixture();
  let result = await action("member@example.test", "password123", true, "A".repeat(51), "Lee");
  assert.match(result.fieldErrors.firstName, /50 characters/);
  assert.equal(result.fieldErrors.lastName, undefined);
  result = await action("member@example.test", "password123", true, "Taylor", "B".repeat(51));
  assert.match(result.fieldErrors.lastName, /50 characters/);
  assert.equal(result.fieldErrors.firstName, undefined);
  assert.equal(calls.auth.length, 0);
  assert.equal(validation.validateGiveawayNames("A".repeat(50), "B".repeat(50)).valid, true);
});
test("combines trimmed names into full_name in Auth and users; preserves opt-in", async () => {
  const { action, calls } = actionFixture();
  const result = await action(" MEMBER@EXAMPLE.TEST ", "password123", true, "  Mary   Jane  ", "  van  Dyke ");
  assert.equal(result.accountCreated, true);
  assert.equal(result.emailConfirmationRequired, false);
  assert.equal(calls.auth[0].options.data.full_name, "Mary Jane van Dyke");
  assert.equal(calls.profiles[0].full_name, "Mary Jane van Dyke");
  assert.equal(calls.profiles[0].email, "member@example.test");
  assert.equal(calls.profiles[0].giveaway_opt_in_at, calls.auth[0].options.data.giveaway_opt_in_at);
  assert.ok(!Number.isNaN(Date.parse(calls.profiles[0].giveaway_opt_in_at)));
  assert.equal(calls.auth[0].options.emailRedirectTo, "https://example.test/api/auth/callback?next=/win");
  assert.equal(calls.welcome[0].fullName, "Mary Jane van Dyke");
});
test("existing email never reaches profile write or welcome email", async () => {
  const { action, calls } = actionFixture({ existing: true });
  const result = await action("member@example.test", "password123", true, "Taylor", "Morgan");
  assert.match(result.error, /already exists/);
  assert.equal(calls.profiles.length, 0);
  assert.equal(calls.welcome.length, 0);
});
test("Auth duplicate/error does not write profile", async () => {
  const { action, calls } = actionFixture({ authError: { message: "User already registered" } });
  const result = await action("member@example.test", "password123", true, "Taylor", "Morgan");
  assert.equal(result.error, "User already registered");
  assert.equal(calls.profiles.length, 0);
});
test("pending confirmation remains account-created, not entered", async () => {
  const { action } = actionFixture({ session: null });
  const result = await action("member@example.test", "password123", true, "Taylor", "Morgan");
  assert.equal(result.accountCreated, true);
  assert.equal(result.emailConfirmationRequired, true);
  assert.equal(result.entered, undefined);
});
test("invalid email, short password, unchecked rules and inactive promotion reject before Auth", async () => {
  for (const [email, password, agreed, status] of [
    ["not-an-email", "password123", true, "active"],
    ["member@example.test", "short", true, "active"],
    ["member@example.test", "password123", false, "active"],
    ["member@example.test", "password123", true, "ended"],
    ["member@example.test", "password123", true, "upcoming"],
  ]) {
    const { action, calls } = actionFixture({ status });
    const result = await action(email, password, agreed, "Taylor", "Morgan");
    assert.ok(result.error);
    assert.equal(calls.auth.length, 0);
  }
});

function formFixture(action = async () => ({ fieldErrors: { firstName: "First name is required." } })) {
  const state = [];
  let cursor = 0;
  const { GiveawayForm } = loadTs("app/win/GiveawayForm.tsx", {
    react: {
      useState: (initial) => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (value) => {
          state[index] = typeof value === "function" ? value(state[index]) : value;
        }];
      },
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/link": { default: "a" },
    "./GiveawayStatus": { GiveawayStatus: () => null },
    "@/app/(auth)/actions": { giveawaySignupAction: action },
    "@/lib/giveaway-signup": validation,
  });
  const render = () => { cursor = 0; return GiveawayForm(); };
  function find(predicate, element = render()) {
    if (!element || typeof element !== "object") return null;
    if (predicate(element)) return element;
    for (const child of [element.props?.children].flat(Infinity)) {
      if (child === undefined) continue;
      const found = find(predicate, child);
      if (found) return found;
    }
    return null;
  }
  const field = (testId) => find((e) => e.props?.["data-testid"] === testId);
  const fill = (testId, value) => field(testId).props.onChange({ target: { value } });
  return { render, find, field, fill };
}

test("actual form gates submission on both names, valid email, password and consent", () => {
  const form = formFixture();
  const disabled = () => form.field("submit-button").props.disabled;
  assert.equal(disabled(), true);
  assert.equal(form.field("input-first-name").props.autoComplete, "given-name");
  assert.equal(form.field("input-last-name").props.autoComplete, "family-name");
  form.fill("input-first-name", "Taylor");
  form.fill("input-last-name", "Morgan");
  form.fill("input-email", "not-an-email");
  form.fill("input-password", "password123");
  form.field("checkbox-terms").props.onChange({ target: { checked: true } });
  assert.equal(disabled(), true);
  form.fill("input-email", "member@example.test");
  assert.equal(disabled(), false);
  form.fill("input-first-name", "   ");
  assert.equal(disabled(), true);
  form.field("input-first-name").props.onBlur();
  assert.equal(form.find((e) => e.props?.id === "first-name-error").props.children, "First name is required.");
  form.fill("input-first-name", "Taylor");
  form.fill("input-last-name", "L".repeat(51));
  assert.equal(disabled(), true);
  form.fill("input-last-name", "Morgan");
  form.fill("input-password", "short");
  assert.equal(disabled(), true);
  form.fill("input-password", "password123");
  form.field("checkbox-terms").props.onChange({ target: { checked: false } });
  assert.equal(disabled(), true);
});

test("actual form sends both names and displays server field errors inline", async () => {
  let argumentsSent;
  const form = formFixture(async (...args) => {
    argumentsSent = args;
    return { fieldErrors: { lastName: "Last name must be 50 characters or fewer." } };
  });
  form.fill("input-first-name", "Taylor");
  form.fill("input-last-name", "Morgan");
  form.fill("input-email", "member@example.test");
  form.fill("input-password", "password123");
  form.field("checkbox-terms").props.onChange({ target: { checked: true } });
  await form.render().props.onSubmit({ preventDefault() {} });
  assert.deepEqual(argumentsSent, ["member@example.test", "password123", true, "Taylor", "Morgan"]);
  assert.equal(form.find((e) => e.props?.id === "last-name-error").props.children, "Last name must be 50 characters or fewer.");
  assert.equal(form.field("input-last-name").props["aria-invalid"], true);
});
