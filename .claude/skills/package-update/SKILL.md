---
name: package-update
description: 協助維護者審查「直接優化教材」的 GitHub PR，並在合併前補上 version.json 版本紀錄。當使用者提到「有 PR 要審」「協力者改了教材」「幫我看這個 PR」「補版本紀錄」等，觸發此 skill。
---

# 教材優化 PR 審查（package-update）

社群協力者透過 GitHub PR 直接優化現有教案（見 [CONTRIBUTING.md](../../../CONTRIBUTING.md) 路徑三）。
這個 skill 是**協助維護者審查與合併**的流程，不是自動套用工具 —— 最終合併由使用者決定。

## 這條流程的設計原則

- **人工審查是安全閘門**：不用白名單硬擋，維護者看得到逐行 diff。自動檢查只擋明顯危險。
- **不猜測**：版本紀錄需要的「修改原因/編輯者/審查者」一律取自 PR 表單；缺欄位就問使用者或請貢獻者補，不要自己編。
- **維護者 commit/push**：這個 skill 不 push，也不替使用者按 merge。

## 自動化元件（已建，跑在 GitHub 上）

- `.github/pull_request_template.md` — 引導貢獻者填：教案代號、修改類型、稱呼、審查者、摘要
- `.github/workflows/package-pr-check.yml` + [scripts/check-package-pr.mjs](../../../scripts/check-package-pr.mjs) — 每個 PR 自動跑：
  - 硬擋密鑰/個資/`_local/`/`_versions/`/`.env`/`*.db`/壞 JSON/超大檔 → 檢查失敗
  - 其餘只提醒（改到非主檔、改到 packages/ 以外、動了 version.json…）
  - 在 PR 留言附上**改寫後每個 HTML 的即時渲染預覽連結**（raw.githack）
  - 注意：fork PR 因 token 唯讀不會自動留言，只會有工作摘要與檢查狀態；此時可用下面方式手動產生預覽

## 使用者請你審一個 PR 時

1. 用 `gh pr view <PR#>` / `gh pr diff <PR#>` 看內容與 PR 表單填的資訊。
2. 檢視重點：改了哪個教案、改了什麼、有沒有動到不該動的檔（檔名、version.json、packages/ 以外）、內容是否合理正確。
3. 需要預覽渲染後的教材時，給出連結（head repo 與 head sha 可從 `gh pr view --json headRepositoryOwner,headRepository,headRefOid` 取得）：
   `https://raw.githack.com/<head_owner>/<head_repo>/<head_sha>/<檔案路徑>`
4. 把「這個 PR 做了什麼、有沒有疑慮、建議合併或請對方調整」精簡回報給使用者，讓他決定。

## 使用者決定合併、要補版本紀錄時

用 [scripts/add-version-record.mjs](../../../scripts/add-version-record.mjs)，欄位一律取自 PR 表單，不要猜：

```bash
node scripts/add-version-record.mjs --node 3.1-III --reason 審查修訂 \
     --editor "貢獻者稱呼" --reviewer "審查者" --summary "PR 表單的變更摘要"
```

- `--reason` 對應 SOP 版號：試教回饋→1.1.x、審查修訂→1.2.x、小維護→1.3.x、大改版→下一大版
- 若 PR 表單沒填修改類型/稱呼/摘要 → **先問使用者或請貢獻者補**，不要自己填
- git 歷史即為舊版備份，這裡不做 `_versions/` 備份
- 補完後由**使用者** commit / push（可能是把版本 commit 併進 PR 分支，或 merge 後於 main 補一筆）

## 收錄「改編紀錄」（模式一）

若 PR 是**改編**（改編自某教案、要掛成原教案頁的「改編紀錄」連結，而非優化官方版），
用 [scripts/add-remix-record.mjs](../../../scripts/add-remix-record.mjs) 收錄，欄位取自 PR：

```bash
node scripts/add-remix-record.mjs --keyId 1.1-III --remixer 王老師 \
     --school 某某國小 --title "都會區情境版" --pr <PR編號>
```

- 只是加一筆連結到 `packages/remixes.json`，build 時顯示在原教案頁；不新增獨立教案、不動 `_index.json`
- 若使用者要讓改編版成為可獨立瀏覽的正式教案（模式二），那要另外登記到 `_index.json`，屬較大變更，先跟使用者確認

## 動手前後
- 動 repo 前先 `git status` 確認乾淨、讓使用者知道有存檔點。
- 完成後回報：審了哪個 PR、版本從幾號到幾號、有沒有提醒事項；push 由使用者執行。
