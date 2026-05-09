# 操作說明：本地 repo、Google Drive 共作與部署

本 repo 是 `community.cce.tw` 的正式發布來源。

Google Drive 只作為老師共作與審查的 staging 區，不要把整個 git repo 放進 Google Drive。

## 一、日常工作目錄

正式本地 repo：

```powershell
cd c:\Users\yjchang\sdgame\cce-teaching-packages
```

Google Drive staging 資料夾：

```powershell
c:\Users\yjchang\sdgame\CCE_Google_Drive_Staging
```

可以把整個 `CCE_Google_Drive_Staging` 複製到 Google Drive 給老師共作，但不要複製 `.git/`、`web/`、`node_modules/`、`.next/` 或整個 repo。

## 二、Google Drive 資料夾用途

```text
CCE_Google_Drive_Staging/
    00_templates              說明與模板
    01_drafts                 老師共編草稿
    02_review                 待審查資料
    03_ready_to_publish       審查完成、準備匯入 GitHub 的正式檔
    04_published_snapshot     目前 GitHub 正式發布版本備份
    99_assets                 圖片、補充素材、Google Docs/Slides 匯出檔
```

只有 `03_ready_to_publish` 會被匯入 repo。

可匯入的正式檔案只有：

```text
README.md
data_card.json
lesson_plan.md
lesson_plan.html
ppt_script.md
ppt.html
worksheet.html
resources.md
qa_report.md
```

正確路徑範例：

```text
03_ready_to_publish/level-iii/1.1-III/lesson_plan.md
03_ready_to_publish/level-iii/1.1-III/lesson_plan.html
03_ready_to_publish/level-iii/1.1-III/ppt.html
```

## 三、第一次或重新產生 Drive 共作包

匯出全部教案：

```powershell
node scripts/drive-sync.mjs export c:\Users\yjchang\sdgame\CCE_Google_Drive_Staging
```

只匯出單一教案：

```powershell
node scripts/drive-sync.mjs export c:\Users\yjchang\sdgame\CCE_Google_Drive_Staging --key=1.1-III
```

如果要覆蓋既有草稿：

```powershell
node scripts/drive-sync.mjs export c:\Users\yjchang\sdgame\CCE_Google_Drive_Staging --key=1.1-III --overwrite-drafts
```

注意：一般不建議覆蓋 `01_drafts`，避免蓋掉老師正在共編的草稿。

## 四、老師改完後，匯入正式檔

先把審查完成的檔案放到：

```text
03_ready_to_publish/level-iii/1.1-III/
```

先做安全檢查：

```powershell
node scripts/drive-sync.mjs verify c:\Users\yjchang\sdgame\CCE_Google_Drive_Staging
```

先預演，不修改 repo：

```powershell
node scripts/drive-sync.mjs import c:\Users\yjchang\sdgame\CCE_Google_Drive_Staging --dry-run
```

確認沒問題後正式匯入：

```powershell
node scripts/drive-sync.mjs import c:\Users\yjchang\sdgame\CCE_Google_Drive_Staging
```

看差異：

```powershell
git diff --stat
git diff
```

## 五、匯入後測試與發布

測試 build：

```powershell
cd web
$env:CUSTOM_DOMAIN="community.cce.tw"
npm run build
cd ..
```

提交與推送：

```powershell
git status --short
git add packages web scripts .github .gitignore
git commit -m "update teaching packages"
git push origin main
```

push 後 GitHub Actions 會自動部署到 `community.cce.tw`。

## 六、安全規則

- 不要把整個 repo 放進 Google Drive。
- 不要把 `.env`、憑證、Google service account、金鑰、token 放進 Drive 或 repo。
- `docs/`、`forms/`、內部規劃文件不要進 public repo。
- `packages/` 只允許正式教案檔案。
- 每台新機器 clone 後先執行一次：

```powershell
node scripts/install-hooks.mjs
```

## 七、常見問題

### 匯入時出現 verification failed

表示 `03_ready_to_publish` 裡有不允許的檔名、路徑或疑似敏感內容。先移除不該發布的檔案，再重新執行 `verify`。

### 網站首頁正常，但教案 iframe 404

確認 build 後有執行 `postbuild`，也就是 `node ../scripts/copy-packages-to-out.mjs`。它會把 `packages/` 複製到 `web/out/packages/`，讓 GitHub Pages 可以直接服務 HTML 檔。

### JSON 中文亂碼或 `_index.json` 壞掉

不要用 PowerShell `Set-Content -Encoding UTF8` 寫 JSON。請用 Node.js `fs.writeFileSync(..., 'utf8')`。

---

# Scripts reference

## build-packages-index.mjs

本地優先讀取 `packages/`，產生網站 build 需要的 `web/data/`。

若指定 `--remote`，才會從 GitHub raw URL 讀取遠端 repo。

### Usage

```bash
# 從專案根目錄：本地 packages/ 優先
node scripts/build-packages-index.mjs

# 強制遠端模式
node scripts/build-packages-index.mjs --remote

# 或從 web/ 目錄 (npm run dev/build 會自動跑)
cd web && npm run dev
```

### 環境變數

| 變數 | 預設 | 說明 |
|---|---|---|
| `CUSTOM_DOMAIN` | 空 | 有設定時，產生 `https://community.cce.tw/packages/...` |
| `PACKAGES_REPO` | `yujchang2017/cce-teaching-packages` | 遠端模式使用的教案 repo |
| `PACKAGES_BRANCH` | `main` | 遠端模式使用的分支 |

### 輸出

```
web/data/
├── packages.json                     ← 主 index (約 500 KB)
└── packages-detail/
    ├── 1.1-II.json                   ← 完整 detail (含 lesson_plan markdown)
    ├── 1.1-III.json
    └── ... (136 個)
```

### 失敗策略

- `_index.json` 抓不到 → exit 1 (build 視為失敗)
- 個別 detail 失敗 → 容忍 ≤ 25%,超過則 exit 1
- 失敗的 keyId 不會出現在網站中

## drive-sync.mjs

Google Drive staging 同步工具。詳見上方操作流程。

## copy-packages-to-out.mjs

`npm run build` 後自動執行，把 `packages/` 複製到 `web/out/packages/`，讓 GitHub Pages 可以服務 `lesson_plan.html`、`ppt.html`、`worksheet.html`。

## install-hooks.mjs

安裝本地 pre-commit 安全檢查。

```powershell
node scripts/install-hooks.mjs
```

## (待實作) weekly-merge.mjs

每週一審核員審完後,維護者跑此 script 把 approved 的改編合併到 cce-teaching-packages repo。

預計實作: Phase 0 Week 3。
