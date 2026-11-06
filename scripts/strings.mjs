// Collects every English string a person can see in Saheli and writes scripts/strings.json.
// Run: node scripts/strings.mjs
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(root, "src");
const SKIP_DIR = /\/(api|server|i18n|workers)\b|\/lib\/i18n\b/;
const SKIP_FILE = /\.test\.tsx?$|\.d\.ts$/;
const ATTRS = new Set(["placeholder", "aria-label", "title", "alt", "label"]);

const ENT = { apos: "'", quot: '"', amp: "&", rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', middot: "·", nbsp: " ", rarr: "→", larr: "←", hellip: "…", ndash: "–", mdash: "—", times: "×", deg: "°", lt: "<", gt: ">" };
const decode = (s) => s.replace(/&(#\d+|[a-z]+);/g, (m, e) => (e[0] === "#" ? String.fromCharCode(+e.slice(1)) : (ENT[e] ?? m)));
export const norm = (s) => decode(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();

function looksLikeUi(s) {
  if (s.length < 2 || s.length > 400) return false;
  if (!/[A-Za-z]{2}/.test(s)) return false;
  if (!/^[A-Z0-9"'(“‘]/.test(s)) return false; // UI strings start with a capital or a number
  if (/[{}<>=;`\\]|=>|https?:|www\.|\.(tsx?|json|svg|png|jpe?g|mp3)\b|^\/|var\(--|^#[0-9a-f]{3,8}$/i.test(s)) return false;
  if (/^[A-Z0-9_]+$/.test(s) && s.length > 1 && !/\s/.test(s) && !/^[A-Z]{2,6}$/.test(s)) return false; // CONSTANT_NAMES
  if (/^[A-Z][a-z]+[A-Z]\w*$/.test(s)) return false; // CamelCase identifiers
  if (/^(GET|POST|PUT|DELETE|Content-Type|Authorization|Bearer)\b/.test(s)) return false;
  if (/^[A-Z]{2}$/.test(s)) return false; // country codes
  if (/^\d[\d\s.,:%/+-]*$/.test(s)) return false;
  if (/^[A-Z][A-Z0-9-]+[:;]/.test(s)) return false; // calendar file lines (BEGIN:VEVENT, DTSTART;...)
  if (/^HK[A-Z]/.test(s)) return false; // Apple Health identifiers
  if (/^\d+(\.\d+)?(px|rem|em|%)$|^2-digit$/.test(s)) return false; // CSS and format options
  if (/Null if not printed|Call this exactly once|You read women's blood and lab reports/.test(s)) return false; // AI tool text
  return true;
}

const out = new Set();
function add(s) {
  const n = norm(s);
  if (looksLikeUi(n)) out.add(n);
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIR.test(p + "/")) walk(p);
    } else if (/\.tsx?$/.test(e.name) && !SKIP_FILE.test(e.name) && !SKIP_DIR.test(p)) scan(p);
  }
}

function scan(file) {
  const text = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (ts.isJsxText(node)) {
      const t = norm(node.getText());
      if (t && /[A-Za-z]/.test(t)) {
        // JSX text is always visible; allow lowercase starts here too
        if (!/[{}<>]/.test(t) && t.length < 400) out.add(t);
      }
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText();
      const init = node.initializer;
      if (init && ATTRS.has(name)) {
        if (ts.isStringLiteral(init)) add(init.text);
        else if (ts.isJsxExpression(init) && init.expression && ts.isStringLiteralLike(init.expression)) add(init.expression.text);
      }
      if (name === "className" || name === "style" || name === "href" || name === "id" || name === "src") return;
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const parent = node.parent;
      // skip object keys, type literals, module names, and className-ish props
      if (parent && (ts.isPropertyAssignment(parent) && parent.name === node)) return;
      if (parent && ts.isLiteralTypeNode(parent)) return;
      if (parent && ts.isElementAccessExpression(parent)) return;
      if (parent && ts.isCallExpression(parent) && /\b(querySelector|getItem|setItem|removeItem|addEventListener|fetch|createElement|require|import|getElementById|matchMedia|cn|clsx)\b/.test(parent.expression.getText())) return;
      if (parent && ts.isBinaryExpression(parent) && /===|!==|==|!=/.test(parent.operatorToken.getText())) return;
      if (parent && ts.isCaseClause(parent)) return;
      add(node.text);
    } else if (ts.isTemplateExpression(node)) {
      // static pieces of `Add ${name}` become patterns elsewhere; keep whole-sentence heads
      const head = norm(node.head.text);
      if (head.length > 12) add(head);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

walk(SRC);
const list = [...out].sort((a, b) => a.localeCompare(b));
fs.writeFileSync(path.join(root, "scripts/strings.json"), JSON.stringify(list, null, 2) + "\n");
console.log(`${list.length} strings -> scripts/strings.json`);
