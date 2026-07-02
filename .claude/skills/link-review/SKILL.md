---
name: link-review
description: 將 review_standalone.html 產生的連結審查 CSV（ccreview_responses*.csv）套用到 packages/ 教案 HTML，安全、可追溯、不用猜測。當使用者提到「審查 CSV」「連結審查」「ccreview_responses」「要改審查意見」等，觸發此 skill。
---

# 連結審查套用（link-review）

處理審查者用 `review_standalone.html` 產出的 `ccreview_responses*.csv`，把裡面的
URL 替換／刪除意見，精確套用到 `packages/level-*/{node}/lesson_plan.html` 與
`ppt.html`，並依 `_local/team-ai-package-update-sop.md` 完成備份與版本升級。

## 核心原則：不要猜，要用權威定位資料

**教訓（來自 2026-07 的實作經驗）：** 同一個外部連結常在同一份教材裡出現好幾次
（例如 `cwa.gov.tw/` 可能出現 5 次），每次出現的教學脈絡完全不同，審查者是
**逐一分開審查每個出現位置**的，不是針對「這個 URL」整體審查。

一開始若只用 CSV 裡的行號或「同一 URL → 同一修法」的假設去比對，會犯兩種錯：
1. 誤判「多次出現只給一個籠統建議」，實際上每次出現都有各自獨立的審查紀錄。
2. 誤把「這幾次出現意義相同該全部套用」跟「這幾次出現意義不同，只有一次該改」搞混。

**正確做法：** `review_standalone.html` 內嵌一個 `<script id="ccreview-data">`
JSON，裡面 `issues[]` 陣列的每一筆都帶有：

```json
{
  "issueId": "Q9811130995",
  "node": "1.1-II",
  "fileType": "lesson_plan.html",
  "url": "https://www.cwa.gov.tw/",
  "context": "<a class=\"ext\" href=\"...\">中央氣象署 — 颱風資訊</a>",
  "hrefOccurrenceIndex": 0,
  "hrefOccurrenceCount": 5
}
```

`hrefOccurrenceIndex`（第幾次出現，0-based）+ `hrefOccurrenceCount`（總共幾次）
是**唯一可靠**的定位方式 —— 這是審查工具本身產生 issue 時就已經算好的，
CSV 裡的 `selectedIssueId` 可以直接對回這筆資料。**一定要有 `review_standalone.html`
才能安全處理**；沒有這個檔案就不要動手套用，只能先列出風險提醒使用者。

## 執行方式

```bash
# 1. 先 dry-run，檢查所有動作是否都能精確定位、有沒有衝突
node scripts/link-review-apply.mjs --dir _local/<審查資料夾> --dry-run

# 2. 若有衝突（同一個出現位置、不同審查者給不同建議），會印出來但不會自動套用。
#    人工看過上下文後決定要用誰的版本，寫一個 resolutions.json：
#    { "<node>|<file>|<url>|<occIndex>": "<CSV裡的審查者原始名字>" }

# 3. 正式套用（會自動備份 + 改 HTML + 升版 version.json）
node scripts/link-review-apply.mjs --dir _local/<審查資料夾> --resolutions resolutions.json
```

腳本位置：[scripts/link-review-apply.mjs](../../../scripts/link-review-apply.mjs)

## 動手前一定要做的事

1. **`git status` 確認乾淨，開始前先讓使用者知道有存檔點可以回退。**（不要自己
   建立額外 commit，除非使用者要求。）
2. dry-run 一定要跑到 0 FAILED 才能正式套用；`OCCURRENCE_COUNT_DRIFT` 代表
   教材檔案內容跟審查當下不同了（可能被其他次審查或編輯改過），必須人工檢查，
   不能硬套。
3. **P3 可延後、「有效，保留」、「網站擋機器，但人工可開」一律不動。**
4. `replacementUrl` 若是 `file:///` 開頭（本機路徑），一律跳過，這是審查者
   複製貼上錯誤，不是可用的網址。
5. 衝突不要自動選「最新的」了事 —— 一定要把兩邊的上下文貼給使用者看，
   讓使用者決定；使用者決定後才寫進 `resolutions.json`。
6. 只允許修改 `lesson_plan.html`、`ppt.html`、`version.json`，其餘檔案
   （`*.md`、`data_card.json`、`worksheet.html`）不動，符合
   [team-ai-package-update-sop.md](../../../_local/team-ai-package-update-sop.md)。
7. 審查者留名一律用代號，對照表在 `_local/reviewer-codenames.json`（不進 git）。
   新審查者要先加進這個檔案，不要把本名直接寫進 `version.json`。
8. 執行完畢要跟使用者回報：改了幾個包、幾筆替換/刪除、版本從幾號到幾號、
   衝突是怎麼解的，並提醒可以用 `git diff` / 還原存檔點檢查。

## 資料清理

- URL 上的 `utm_*`、`_ga*`、`_gl`、`_gcl_*`、`fbclid`、`gclid` 等追蹤參數會
  自動移除，不需要手動處理。

## 版本號規則（依 SOP）

- `1.0.x` / `1.1.x` → 升到 `1.2.0`（第一次正式審查後修訂）
- 已經是 `1.2.x` → 升到 `1.2.{x+1}`（後續連結修正、非首次審查）
- 其餘情況（例如要跳大版號）腳本會直接丟錯，交給人工判斷，不要硬猜。
