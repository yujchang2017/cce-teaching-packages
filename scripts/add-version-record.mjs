// 維護者「審查時補版本紀錄」用（本機執行，不進 CI）。
//
// 依 team-ai-package-update-sop.md 的版本規則，把一筆新版本紀錄加進某教案的 version.json。
// 因為改用 GitHub PR 流程、git 歷史即為舊版備份，這裡不再複製檔案到 _versions/。
//
// 典型用法（merge 前，在該 PR 的分支上跑，或 merge 後於 main 上跑後再一起 commit）：
//   node scripts/add-version-record.mjs --node 3.1-II --reason 審查修訂 \
//        --editor 王老師 --reviewer 李老師 --summary "優化活動二說明，補上在地案例"
//
// --reason 擇一：試教回饋 | 審查修訂 | 小維護 | 大改版
//   試教回饋 → 1.1.x   審查修訂 → 1.2.x   小維護 → 1.3.x   大改版 → 下一個大版號
//   （若目前版本已達或超過該階段，則 patch +1）

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function arg(n) {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const node = arg("node");
const reason = arg("reason");
const editor = arg("editor") || "";
const reviewer = arg("reviewer") || "";
const summary = arg("summary") || "";

if (!node || !reason) {
  console.error("需要 --node <教案代號> 與 --reason <試教回饋|審查修訂|小維護|大改版>");
  process.exit(1);
}

const REASON_MINOR = { 試教回饋: 1, 審查修訂: 2, 小維護: 3 };
const LABEL = { 試教回饋: "試教回饋修正版", 審查修訂: "審查後修訂版", 小維護: "小維護版", 大改版: "重大改版" };

function findVersionFile(node) {
  for (const lvl of ["level-i", "level-ii", "level-iii", "level-iv", "level-v"]) {
    const p = path.join(REPO_ROOT, "packages", lvl, node, "version.json");
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const vf = findVersionFile(node);
if (!vf) {
  console.error(`找不到 ${node} 的 version.json`);
  process.exit(1);
}

const v = JSON.parse(fs.readFileSync(vf, "utf8"));
const cur = v.currentVersion;
const [maj, min, pat] = cur.split(".").map(Number);

let next;
if (reason === "大改版") {
  next = `${maj + 1}.0.0`;
} else {
  const T = REASON_MINOR[reason];
  if (T === undefined) {
    console.error(`不認得的 --reason：${reason}（可用：試教回饋|審查修訂|小維護|大改版）`);
    process.exit(1);
  }
  next = min < T ? `${maj}.${T}.0` : `${maj}.${min}.${pat + 1}`;
}

const today = new Date().toISOString().slice(0, 10);
v.versions.unshift({
  version: next,
  date: today,
  label: LABEL[reason],
  editor,
  reviewer,
  reviewStatus: "approved",
  summary,
  files: { lessonPlan: "lesson_plan.html", ppt: "ppt.html", worksheet: "worksheet.html" },
});
v.currentVersion = next;
v.recommendedVersion = next;
v.status = "recommended";

fs.writeFileSync(vf, JSON.stringify(v, null, 2) + "\n", "utf8");
console.log(`${node}: ${cur} -> ${next}  (${LABEL[reason]})  editor=${editor || "-"} reviewer=${reviewer || "-"}`);
console.log(`已更新 ${path.relative(REPO_ROOT, vf)}`);
