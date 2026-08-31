import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const htmlFiles = [
  "index.html",
  "guides/grok-alipay.html",
  "guides/grok-no-overseas-card.html",
  "guides/grok-recharge-requirements.html",
  "guides/supergrok-heavy-price.html",
  "guides/grok-payment-order-support.html"
];
const errors = [];
const titles = new Map();
const canonicals = new Map();
const banned = ["xAI 官方授权", "100%安全", "永久稳定", "全网最低", "无限使用"];

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const count = (text, pattern) => (text.match(pattern) || []).length;

for (const file of htmlFiles) {
  const html = read(file);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  if (!title) errors.push(`${file}: missing title`);
  if (!canonical) errors.push(`${file}: missing canonical`);
  if (count(html, /<h1(?:\s[^>]*)?>/gi) !== 1) errors.push(`${file}: must contain exactly one H1`);
  if (!/<meta name="description" content="[^"]{50,}"/i.test(html)) errors.push(`${file}: missing or short description`);
  if (!/"@type":"?Article"?|"@type": "Article"/i.test(html)) errors.push(`${file}: missing Article JSON-LD`);
  if (!/"@type":"?BreadcrumbList"?|"@type": "BreadcrumbList"/i.test(html)) errors.push(`${file}: missing BreadcrumbList JSON-LD`);
  if (!/2026-08-31/.test(html)) errors.push(`${file}: missing current fact-check date`);
  if (title) {
    if (titles.has(title)) errors.push(`${file}: duplicate title with ${titles.get(title)}`);
    titles.set(title, file);
  }
  if (canonical) {
    if (canonicals.has(canonical)) errors.push(`${file}: duplicate canonical with ${canonicals.get(canonical)}`);
    canonicals.set(canonical, file);
  }
  for (const phrase of banned) {
    if (html.includes(phrase)) {
      errors.push(`${file}: banned phrase ${phrase}`);
    }
  }
  if (html.includes("微信支付") && !html.includes("付款前") && !html.includes("人工协助")) errors.push(`${file}: WeChat payment assistance boundary missing`);
  const externalCommercial = [...html.matchAll(/href="https:\/\/www\.aixiamo\.com\/(?:grok|item\/17|order-query)[^"]*"/g)].length;
  if (externalCommercial > 1) errors.push(`${file}: more than one task-matched commercial link (${externalCommercial})`);
}

const facts = JSON.parse(read("data/facts.json"));
const livePlans = new Map(facts.aixiamo.plans?.map((plan) => [plan.periodMonths, plan.priceCny]));
if (livePlans.get(1) !== 380 || livePlans.get(3) !== 580 || livePlans.size !== 2) errors.push("facts.json: live 1/3-month offer mismatch");
if (facts.aixiamo.threeMonthSavingsVsMonthlyCny !== 560) errors.push("facts.json: three-month savings mismatch");
if (facts.aixiamo.selfServiceWechatPayment !== false || facts.aixiamo.assistedWechatPaymentBeforeCheckout !== true) errors.push("facts.json: WeChat payment boundary mismatch");
if (!facts.aixiamo.warranty.includes("验收后无质保")) errors.push("facts.json: warranty boundary missing");
for (const credential of ["密码", "验证码", "恢复码", "Cookie", "SSO", "Session", "Token"]) {
  if (!facts.aixiamo.sensitiveCredentialsNotRequestedForOwnAccount.includes(credential)) errors.push(`facts.json: missing credential boundary ${credential}`);
}

const sitemap = read("sitemap.xml");
for (const file of htmlFiles) {
  const suffix = file === "index.html" ? "/" : `/${file}`;
  if (!sitemap.includes(`https://fangmumu111-bot.github.io/grok-cn-recharge-guide${suffix}`)) errors.push(`sitemap.xml: missing ${file}`);
}
if (count(sitemap, /<loc>/g) !== htmlFiles.length) errors.push("sitemap.xml: unexpected URL count");

const js = read("assets/site.js");
if (/innerHTML\s*=\s*[^"']/.test(js)) errors.push("site.js: dynamic innerHTML assignment detected");

const css = read("assets/site.css");
if (!/html, body \{[^}]*overflow-x: clip/s.test(css)) errors.push("site.css: html and body must use overflow-x: clip");
if (/#[0-9a-f]{3,8}\b|\brgb\(|\bhsl\(|\boklch\(/i.test(css)) errors.push("site.css: raw colour outside tokens.css");
if (/transition:\s*all|transition-all/i.test(css)) errors.push("site.css: transition-all is forbidden");
if (!/@media \(prefers-reduced-motion: reduce\)/.test(css)) errors.push("site.css: missing reduced-motion fallback");

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} unique task pages, facts, sitemap and credential boundaries.`);
