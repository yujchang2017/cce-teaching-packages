// PR 教材檢查（給 GitHub Actions 用，也可本機測試）
//
// 角色：助手，不是守門員 —— 真正的把關是維護者逐行審查 PR。
// 這支腳本只做兩件事：
//   1) 硬擋「不管多仔細都該擋」的危險（密鑰、個資、私有路徑、壞 JSON、超大檔）→ 讓檢查失敗
//   2) 其餘一律「提醒不阻擋」：整理這個 PR 改了什麼，並附上改寫後教材的即時預覽連結
//
// 為什麼不用白名單硬擋其他檔案：熱心貢獻者可能順手優化 .md 或其他檔，
// 在 PR + 人工審查模式下，維護者看得到 diff，硬擋反而擋掉善意貢獻。
//
// 用法（Actions）：工作流程先把變更清單寫到 changed.txt / deleted.txt，再跑本腳本。
// 本機測試：node scripts/check-package-pr.mjs --changed packages/level-ii/3.1-II/lesson_plan.html

import fs from "fs";
import path from "path";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const HEAD_REPO = process.env.HEAD_REPO || "OWNER/REPO";
const HEAD_SHA = process.env.HEAD_SHA || "HEAD";

function readList(file, cliName) {
  const cli = arg(cliName);
  if (cli) return cli.split(",").map((s) => s.trim()).filter(Boolean);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  return [];
}

const changed = readList("changed.txt", "changed");
const deleted = readList("deleted.txt", "deleted");

// ---- 危險樣式（硬擋）----
const DANGER_PATH = [
  /(^|\/)_local\//,
  /(^|\/)_versions\//,
  /(^|\/)\.env(\.|$)/,
  /\.db$/,
  /\.pem$/,
  /\.key$/,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/,
  /service-account.*\.json$/i,
  /(^|\/)credentials\.json$/i,
  /(^|\/)secrets\.json$/i,
  /token.*\.txt$/i,
  /apikey/i,
  /\.p12$/,
  /\.pfx$/,
];
const SECRET_CONTENT = [
  /-----BEGIN[A-Z ]*PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/, // AWS access key id
  /AIza[0-9A-Za-z_\-]{35}/, // Google API key
];
const HARD_SIZE = 20 * 1024 * 1024;
const WARN_SIZE = 5 * 1024 * 1024;

const dangers = [];
const notes = [];
const previews = [];
const touchedPkgs = new Set();
const nonContentInPkg = [];
const outsidePkg = [];
let contributorTouchedVersion = false;

function pkgOf(p) {
  const m = p.match(/^packages\/(level-[^/]+)\/([^/]+)\//);
  return m ? { level: m[1], node: m[2] } : null;
}

// 慣例上允許註解的 JSONC 檔（devcontainer / .vscode / tsconfig 等），
// 不能用嚴格 JSON.parse 驗證，否則會誤判成壞 JSON。教材 JSON（packages/**）不在此列，仍嚴格檢查。
function isJsonc(p) {
  const base = path.posix.basename(p);
  return (
    /(^|\/)\.devcontainer\//.test(p) ||
    /(^|\/)\.vscode\//.test(p) ||
    base === "devcontainer.json" ||
    /^(tsconfig|jsconfig)(\..+)?\.json$/.test(base)
  );
}

for (const p of changed) {
  if (DANGER_PATH.some((re) => re.test(p))) dangers.push(`禁止的檔案/路徑：\`${p}\``);

  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    const size = fs.statSync(p).size;
    if (size > HARD_SIZE) dangers.push(`檔案過大（${(size / 1048576).toFixed(1)}MB）：\`${p}\``);
    else if (size > WARN_SIZE) notes.push(`檔案較大（${(size / 1048576).toFixed(1)}MB），請確認是否必要：\`${p}\``);

    if (p.endsWith(".json") && !isJsonc(p)) {
      try {
        JSON.parse(fs.readFileSync(p, "utf8"));
      } catch (e) {
        dangers.push(`JSON 格式錯誤，無法解析：\`${p}\`（${e.message}）`);
      }
    }
    if (/\.(html|md|json|js|mjs|cjs|ts|tsx|css|txt|ya?ml)$/i.test(p) && size < WARN_SIZE) {
      const txt = fs.readFileSync(p, "utf8");
      if (SECRET_CONTENT.some((re) => re.test(txt))) dangers.push(`疑似含密鑰內容：\`${p}\``);
    }
  }

  const pk = pkgOf(p);
  if (pk) {
    touchedPkgs.add(`${pk.level}/${pk.node}`);
    const base = path.posix.basename(p);
    if (base === "version.json") contributorTouchedVersion = true;
    else if (!/^(lesson_plan|ppt|worksheet)\.html$/.test(base)) nonContentInPkg.push(p);
    if (/\.html$/.test(base)) previews.push({ p, node: pk.node });
  } else {
    outsidePkg.push(p);
  }
}

for (const p of deleted) {
  if (/(lesson_plan|ppt|worksheet)\.html$/.test(p)) notes.push(`刪除了固定檔名檔案，通常不該發生：\`${p}\``);
}

// ---- 組出留言 ----
const L = [];
L.push("<!-- package-pr-check -->");
L.push("## 🤖 教材 PR 自動檢查");
L.push("");
L.push("> 這只是輔助檢查。**最終由維護者逐行審查後決定是否合併** —— 歡迎熱心優化教材。");
L.push("");

if (dangers.length) {
  L.push("### 🚫 需要先修正（安全 / 完整性）");
  for (const d of dangers) L.push(`- ${d}`);
  L.push("");
}

L.push("### 📋 這個 PR 改了什麼");
if (touchedPkgs.size) L.push(`- 教案：${[...touchedPkgs].map((x) => `\`${x}\``).join("、")}`);
if (nonContentInPkg.length) {
  L.push(`- ⚠️ 也改到教材主檔以外的檔案（.md / data_card.json 等），請留意是否預期：`);
  for (const p of nonContentInPkg) L.push(`  - \`${p}\``);
}
if (outsidePkg.length) {
  L.push(`- ⚠️ 改到 \`packages/\` 以外的檔案（網站程式 / 設定），請確認：`);
  for (const p of outsidePkg) L.push(`  - \`${p}\``);
}
if (contributorTouchedVersion) L.push("- ℹ️ 這個 PR 動了 `version.json`；依流程版本紀錄由維護者於審查時補上，請確認是否衝突。");
for (const n of notes) L.push(`- ⚠️ ${n}`);
if (!touchedPkgs.size && !outsidePkg.length) L.push("- （沒有偵測到教材檔變更）");
L.push("");

if (previews.length) {
  L.push("### 👀 改寫後預覽（即時渲染）");
  L.push("點開即可看到這個 PR 改寫後的教材頁面：");
  for (const { p, node } of previews) {
    const url = `https://raw.githack.com/${HEAD_REPO}/${HEAD_SHA}/${p}`;
    L.push(`- \`${node}\` — [${path.posix.basename(p)}](${url})`);
  }
  L.push("");
  L.push("<sub>預覽由第三方服務 raw.githack.com 即時渲染公開檔案，僅供檢視。</sub>");
  L.push("");
}

fs.writeFileSync("comment.md", L.join("\n"));

const danger = dangers.length > 0;
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `danger=${danger}\n`);
console.log(L.join("\n"));
console.log(`\n---\ndanger=${danger}`);
