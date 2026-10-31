const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const ts = require("typescript");

const source = (file) => readFileSync(join(__dirname, "..", file), "utf8");
const jsx = (type, props) => ({ type, props });
const runtime = { jsx, jsxs: jsx };
function load(file, deps = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module, exports: module.exports, Date, URL, process: { env: {} },
    require(name) {
      if (!(name in deps)) throw new Error(`Unexpected dependency: ${name}`);
      return deps[name];
    },
  });
  return module.exports;
}
function nodes(node) {
  if (!node || typeof node !== "object") return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
}
const text = (node) => node == null || typeof node === "boolean" ? ""
  : typeof node !== "object" ? String(node)
  : [node.props?.children].flat(Infinity).map(text).join("");
const confirmedTitle = "The instructor confirmed this lesson took place. Instructors never see ratings or comments.";
const pendingTitle = "The instructor has not confirmed this lesson yet.";

test("review badges label lesson confirmation, include tooltips, and use accessible neutral contrast", () => {
  const { ReviewCard } = load("components/review/ReviewCard.tsx", {
    "react/jsx-runtime": runtime,
    "@/lib/utils": { scoreColor: () => "#000000", scoreBg: () => "#ffffff" },
  });
  for (const is_verified of [false, true]) {
    const tree = ReviewCard({ review: { id: "review", rating_value: 3, rating_effectiveness: 4, rating_punctuality: 5, comment: "Example", is_verified } });
    const badge = nodes(tree).find(n => n.props?.title === (is_verified ? confirmedTitle : pendingTitle));
    assert.ok(badge);
    assert.equal(text(badge).trim(), is_verified ? "✓ Lesson confirmed" : "Not yet confirmed");
    if (!is_verified) assert.match(badge.props.className, /bg-slate-100 text-slate-600/);
  }
  const luminance = (hex) => hex.match(/\w\w/g).map(c => parseInt(c, 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  assert.ok((luminance("f1f5f9") + 0.05) / (luminance("475569") + 0.05) >= 4.5);
});

test("student session history renders both lesson states and tooltips without changing its query filters", async () => {
  const review = { id: "review", session_date: "2026-10-01", session_location: "Court",
    rating_value: 3, rating_effectiveness: 4, rating_punctuality: 5, instructors: { full_name: "Coach" } };
  const filters = [];
  const { default: page } = load("app/(main)/sessions/page.tsx", {
    "react/jsx-runtime": runtime,
    "next/navigation": { redirect() { throw new Error("Unexpected redirect"); } },
    "@/lib/supabase/server": {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "student" } } }) } }),
      createServiceClient: () => ({ from(table) {
        const query = {
          select() { return query; },
          eq(...args) { filters.push([table, ...args]); return query; },
          async single() { return { data: null }; },
          async order() { return { data: [{ ...review, is_verified: false }, { ...review, id: "other", is_verified: true }] }; },
        };
        return query;
      } }),
    },
  });
  const tree = await page();
  assert.match(text(tree), /confirmation status/);
  assert.ok(text(tree).includes("✓ Lesson confirmed"));
  assert.ok(text(tree).includes("Not yet confirmed"));
  assert.ok(nodes(tree).some(n => n.props?.title === confirmedTitle));
  assert.ok(nodes(tree).some(n => n.props?.title === pendingTitle));
  assert.ok(filters.some(([table, key, value]) => table === "reviews" && key === "student_id" && value === "student"));
});

test("email copy explains lesson confirmation without sending emails", async () => {
  const sent = [];
  const email = load("lib/resend.ts", { resend: { Resend: class {
    constructor() { this.emails = { send: async (payload) => { sent.push(payload); return {}; } }; }
  } } });
  await email.sendVerificationRequestEmail({ to: "instructor@example.test", instructorName: "Coach", studentName: "Student",
    sessionDate: "2026-10-01", sessionTime: "10:00", sessionLocation: "Court" });
  await email.sendVerificationConfirmedEmail({ to: "student@example.test", instructorName: "Coach", sessionDate: "2026-10-01" });
  assert.equal(sent[0].subject, "A student asked you to confirm a lesson");
  assert.ok(sent[0].html.includes("You will not see the student's rating or comments"));
  assert.equal(sent[1].subject, "Your lesson was confirmed ✓");
  assert.ok(sent[1].html.includes("Your review now shows '<strong>Lesson confirmed</strong>'"));
  assert.ok(sent[1].html.includes("cannot see your rating or comments"));
  for (const message of sent) assert.doesNotMatch(message.html, /verified|verify|verification|identity/i);
});

test("public and legal copy limits confirmation claims; legal disclaimers remain", () => {
  const site = load("lib/site.ts");
  assert.equal(site.SITE_DESCRIPTION, "Honest, anonymous reviews of tennis instructors from students and parents. Find the right coach for you or your child.");
  assert.equal(site.SITE_IMAGE.alt, "Rovi: honest reviews of private instructors. Tennis.");
  assert.ok(source("app/page.tsx").includes("Honest, anonymous reviews from students and parents, each tied to a specific lesson."));
  const profile = source("app/(main)/instructors/[id]/page.tsx");
  assert.ok(profile.includes("&apos;Lesson confirmed&apos; means the instructor confirmed the lesson took place. Instructors never see ratings or comments."));
  assert.ok(profile.includes('confirmed {verifiedSessions === 1 ? "lesson" : "lessons"}'));
  const terms = source("app/terms/page.tsx");
  const privacy = source("app/privacy/page.tsx");
  assert.ok(terms.includes("Where an instructor has joined Rovi, the instructor can confirm that a lesson took place. Rovi does not verify the truth of the opinions expressed within a review."));
  assert.ok(terms.includes("Rovi does not create, write, or verify the substance of User Content"));
  for (const page of [terms, privacy]) {
    assert.ok(page.includes("Last updated: 10/31/2026"));
    assert.doesNotMatch(page, /anonymous, verified|verifies that a review|Session verification data/);
  }
  assert.ok(privacy.includes("supporting lesson confirmation"));
});
