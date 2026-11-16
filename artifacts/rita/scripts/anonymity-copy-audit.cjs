// Read-only source audit. Prints JSON; it never edits application copy or data.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const workspace = path.resolve(__dirname, "../../..");
const keyword = /\banonymous\b|\banonymity\b|\bconfidential\b|\bprivate\b|\bidentity\b|never shown|never disclosed/i;
const segments = new Intl.Segmenter("en", { granularity: "sentence" });
const units = new Set(["p", "li", "span", "label", "h1", "h2", "h3", "button", "title"]);
const entries = [];
const internal = [];
const seen = new Set();
const decode = text => text.replace(/&(?:apos|#39|quot|amp|lt|gt|nbsp);/g, entity => ({
  "&apos;": "'", "&#39;": "'", "&quot;": '"', "&amp;": "&", "&lt;": "<", "&gt;": ">", "&nbsp;": " ",
})[entity]).replace(/\s+/g, " ").trim();

function location(file, node, source) {
  const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  const context = ({
    "artifacts/rita/app/page.tsx": "Homepage hero",
    "artifacts/rita/lib/resend.ts": "Transactional email template",
    "artifacts/rita/lib/site.ts": "Default site metadata / social image alt text",
    "artifacts/rita/components/club/ClubPageContent.tsx": "/clubs/[slug] anonymity notice",
    "artifacts/rita/components/review/ReviewForm.tsx": "/reviews/new form",
    "artifacts/rita/components/ranking/PrivateRankingList.tsx": "/ranking private-ranking badge",
    "artifacts/rita/components/admin/InstructorAdminTable.tsx": "/admin/instructors admin-only form label",
    "artifacts/rita/components/instructor/AddInstructorForm.tsx": "/instructors/new helper",
    "artifacts/rita/app/(main)/instructor-info/page.tsx": "/instructor-info claim instructions",
    "artifacts/rita/app/(main)/reviews/submitted/page.tsx": "/reviews/submitted confirmation notice",
    "artifacts/rita/app/(main)/instructors/[id]/page.tsx": "/instructors/[id] above reviews",
    "artifacts/rita/app/win/page.tsx": "/win metadata description",
    "artifacts/rita/app/win/GiveawayContent.tsx": "/win review-entry instructions",
    "artifacts/rita/app/api/instructors/[id]/route.ts": "GET /api/instructors/[id]: userName fallback value",
  })[file] ?? file.replace(/^artifacts\/rita\/app/, "").replace(/\/page\.tsx$/, "");
  let where = context;
  if (file.endsWith("/lib/resend.ts")) {
    let ancestor = node;
    while (ancestor && !ts.isFunctionDeclaration(ancestor)) ancestor = ancestor.parent;
    where += ancestor?.name ? ` (${ancestor.name.text})` : "";
  }
  return { file, line, where };
}
function add(file, node, source, value) {
  const fragments = value.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\$\{[^}]+\}/g, "")
    .replace(/<\/(?:p|h[1-6]|div|a|li|tr|td|table)>|<br\s*\/?>/gi, "\u0000")
    .replace(/<[^>]*>/g, " ").split("\u0000");
  for (const fragment of fragments) addFragment(file, node, source, fragment);
}
function addFragment(file, node, source, value) {
  const normalized = decode(value);
  if (!keyword.test(normalized)) return;
  const place = location(file, node, source);
  if (/^\/(?:api\/)?rankings\/private$/.test(normalized)) {
    internal.push({ ...place, text: normalized, where: "Internal endpoint path; not displayed as user-facing wording" });
    return;
  }
  const parts = ts.isJsxElement(node) && /^h[1-6]$/.test(node.openingElement.tagName.getText(source))
    ? [{ segment: normalized }] : segments.segment(normalized);
  for (const part of parts) {
    const sentence = part.segment.trim();
    if (!keyword.test(sentence)) continue;
    const key = `${file}:${place.line}:${sentence}`;
    if (!seen.has(key)) {
      seen.add(key);
      entries.push({ ...place, sentence });
    }
  }
}
function jsxText(node, source) {
  if (ts.isJsxText(node)) return node.getText(source);
  if (ts.isJsxExpression(node)) {
    return node.expression && ts.isStringLiteralLike(node.expression) ? node.expression.text : "";
  }
  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
    return node.children.map(child => jsxText(child, source)).join("");
  }
  return "";
}
function collect(filePath) {
  const file = path.relative(workspace, filePath).replaceAll(path.sep, "/");
  const source = ts.createSourceFile(filePath, fs.readFileSync(filePath, "utf8"), ts.ScriptTarget.Latest, true);
  const covered = new Set();
  function mark(node) {
    covered.add(node);
    ts.forEachChild(node, mark);
  }
  function visit(node) {
    if (covered.has(node)) return;
    if (ts.isJsxElement(node) && units.has(node.openingElement.tagName.getText(source))) {
      const value = jsxText(node, source);
      if (keyword.test(decode(value))) {
        add(file, node, source, value);
        // Still audit conditional copy, such as the submit button's label.
        function markStatic(child) {
          if (ts.isJsxExpression(child) && child.expression && !ts.isStringLiteralLike(child.expression)) return;
          covered.add(child);
          ts.forEachChild(child, markStatic);
        }
        node.children.forEach(markStatic);
      }
    } else if (ts.isJsxText(node) && keyword.test(decode(node.getText(source)))) {
      add(file, node.parent, source, jsxText(node.parent, source));
    } else if (ts.isStringLiteralLike(node)) {
      add(file, node, source, node.text);
    } else if (ts.isTemplateExpression(node)) {
      let value = node.head.text;
      for (const span of node.templateSpans) value += `\${${span.expression.getText(source)}}${span.literal.text}`;
      add(file, node, source, value);
      mark(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "scripts", ".replit-artifact"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:tsx?|jsx?)$/.test(file) && !entry.name.endsWith(".d.ts") && !entry.name.includes(".config.")) collect(file);
  }
}
walk(path.join(workspace, "artifacts"));
entries.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
console.log(JSON.stringify({
  scope: "Application source in artifacts/rita, the legacy API server, and the canvas app; dependencies, generated builds, tests and tooling excluded. No flyer pages exist in this source tree. Image copy is reported separately.",
  entries,
  internal,
}, null, 2));
