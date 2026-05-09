#!/usr/bin/env node
/**
 * Install git pre-commit hook for cce-teaching-packages
 * Run once: node scripts/install-hooks.mjs
 */
import { writeFile, chmod, access } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const HOOK_PATH = join(ROOT, ".git", "hooks", "pre-commit");

const HOOK_CONTENT = `#!/bin/sh
# cce-teaching-packages pre-commit safety check
# 自動安裝: node scripts/install-hooks.mjs

echo "[pre-commit] 執行安全檢查..."

BLOCKED=0

# ---- 1. 絕對禁止的檔案類型 ----
SENSITIVE=$(git diff --cached --name-only | grep -iE '\\.(pem|key|p12|pfx|crt|cer)$|^id_(rsa|dsa|ecdsa|ed25519)|service-account.*\\.json|firebase-adminsdk.*\\.json|credentials\\.json|secrets\\.(json|yaml|yml)|client_secret.*\\.json' | grep -v '\\.example$')
# .env 系列: 允許 .example 結尾、允許 .env.example
ENV_FILES=$(git diff --cached --name-only | grep -iE '(^|/)\\.env(\\.|$)' | grep -v '\\.example$' | grep -v '\\.env\\.example$')
if [ -n "$SENSITIVE" ] || [ -n "$ENV_FILES" ]; then
  echo "[pre-commit] ❌ 發現敏感檔案，禁止提交:"
  [ -n "$SENSITIVE" ] && echo "$SENSITIVE"
  [ -n "$ENV_FILES" ] && echo "$ENV_FILES"
  BLOCKED=1
fi

# ---- 2. 禁止的目錄 ----
BLOCKED_DIRS=$(git diff --cached --name-only | grep -E '^(docs/|forms/|\.private/|private_notes/|scratch/)')
if [ -n "$BLOCKED_DIRS" ]; then
  echo "[pre-commit] ❌ 發現禁止目錄中的檔案:"
  echo "$BLOCKED_DIRS"
  BLOCKED=1
fi

# ---- 3. 禁止的內部文件命名 ----
INTERNAL_DOCS=$(git diff --cached --name-only | grep -iE '(^|/)PLAN[^/]*\\.md$|(^|/)ARCHITECTURE[^/]*\\.md$|(^|/)SECURITY_BASELINE[^/]*\\.md$|(^|/)MAINTAINER[^/]*\\.md$|_SOP\\.md$|_GUIDE\\.md$|TRAINING[^/]*\\.md$|TESTING[^/]*\\.md$')
if [ -n "$INTERNAL_DOCS" ]; then
  echo "[pre-commit] ❌ 發現內部文件，禁止提交:"
  echo "$INTERNAL_DOCS"
  BLOCKED=1
fi

# ---- 4. packages/ 下只允許白名單檔案 ----
PKG_VIOLATIONS=$(git diff --cached --name-only | grep '^packages/' | grep -vE '^packages/_index\\.json$|^packages/_meta\\.json$|^packages/[^/]+/[^/]+/(data_card\\.json|lesson_plan\\.(md|html)|ppt_script\\.md|ppt\\.html|worksheet\\.html|resources\\.md|qa_report\\.md|README\\.md)$|^packages/[^/]+/$|^packages/$')
if [ -n "$PKG_VIOLATIONS" ]; then
  echo "[pre-commit] ❌ packages/ 下有不允許的檔案:"
  echo "$PKG_VIOLATIONS"
  echo "  允許清單: data_card.json, lesson_plan.md/html, ppt_script.md, ppt.html,"
  echo "            worksheet.html, resources.md, qa_report.md, README.md"
  BLOCKED=1
fi

# ---- 5. 偵測可能的 token / secret 內容 ----
# 排除 npm registry URL (tgz), 排除 package-lock.json 的 resolved 欄位
TOKEN_PATTERN=$(git diff --cached -U0 | grep '^\+' | grep -v '^\+\+\+' | grep -v '"resolved".*npmjs.org' | grep -v '"resolved".*registry.yarnpkg' | grep -iE '(ghp_|ghs_|glpat-|sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}|eyJhbGciOiJ)[A-Za-z0-9/+=_-]{10,}')
if [ -n "$TOKEN_PATTERN" ]; then
  echo "[pre-commit] ⚠️  偵測到可能的 token/key 內容，請確認是否為測試資料:"
  echo "$TOKEN_PATTERN" | head -5
  echo "如確認安全，執行: git commit --no-verify"
  BLOCKED=1
fi

if [ "$BLOCKED" = "1" ]; then
  echo ""
  echo "[pre-commit] 提交已阻擋。修正以上問題後再 commit。"
  echo "如需強制跳過（需要充分理由）: git commit --no-verify"
  exit 1
fi

echo "[pre-commit] ✅ 安全檢查通過"
exit 0
`;

async function main() {
  try {
    await access(join(ROOT, ".git"));
  } catch {
    console.error("錯誤：找不到 .git 目錄，請在 repo 根目錄執行此腳本");
    process.exit(1);
  }

  await writeFile(HOOK_PATH, HOOK_CONTENT, "utf8");
  try {
    await chmod(HOOK_PATH, 0o755);
    console.log(`✅ pre-commit hook 已安裝: ${HOOK_PATH}`);
  } catch {
    // Windows 不支援 chmod，但 git 會嘗試執行
    console.log(`✅ pre-commit hook 已安裝（Windows 環境，chmod 略過）: ${HOOK_PATH}`);
    console.log("   Windows 上 git bash 會自動嘗試執行此 hook");
  }
}

main().catch(console.error);
