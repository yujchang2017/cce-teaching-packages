# 如何參與回饋與改編

歡迎老師、教育工作者、學生、家長一起試用這些教案，並回饋現場經驗或改編成果。我們目前提供兩種參與路徑：

---

## 路徑一：表單路徑（推薦給不熟悉 GitHub 的夥伴）

前往 [community.cce.tw](https://community.cce.tw)，在各教案頁面點選「試教／回饋表單」後，您可以：

1. 第一次提交時先填寫「貢獻者基本資料表」
2. 之後以已驗證 Google Email 作為投稿者識別
3. 選擇「回饋意見」或「分享試教回饋」
4. 表單會預填教案編號與提交類型
5. 送出後由社群審查團隊每週批次審查

**不需要懂 Git、不需要裝任何軟體**。

> 基本資料表只需第一次填寫；後續回饋會以同一個 Google Email 與基本資料對照。

---

## 路徑二：技術路徑（熟悉 GitHub 的貢獻者）

### 準備工作
- GitHub 帳號
- 基本 Git 操作（clone, branch, commit, push）
- Markdown 與 HTML 基礎編輯能力

### 步驟

1. **Fork 本倉庫** 到您的帳號下
2. **建立新分支**：命名格式 `remix/您的名字-教案編號`
   ```bash
   git checkout -b remix/wang-laoshi-1.1-III
   ```
3. **複製要改編的教案資料夾**（不要覆蓋原版）：
   ```
   packages/level-iii/1.1-III/              ← 原版，別動
   packages/level-iii/1.1-III--remix-王老師/  ← 您的改編版放這裡
   ```
4. **編輯內容**，並在改編版的 `_meta.json` 加入：
   ```json
   {
     "origin": "remix",
     "based_on": "1.1-III",
     "remixer": "王小明老師",
     "remix_notes": "改編重點：調整為都會區情境、新增氣候難民議題"
   }
   ```
5. **提交並推送**：
   ```bash
   git add -A
   git commit -m "Remix 1.1-III：都會區情境版（王小明老師）"
   git push origin remix/wang-laoshi-1.1-III
   ```
6. **送 Pull Request** 到 `main` 分支，填寫 PR 描述

### 審查流程

社群目前以 Google Form 與 Google Sheets 進行初步收件與審查：

1. 投稿者送出回饋或試教記錄後，系統通知審查團隊
2. 審查員進入回覆試算表，依提交類型檢查內容、授權與附件
3. 若資料不足，審查員以 Email 請投稿者補件
4. 通過後，維護者整理可公開內容並合併到主庫或網站資料
5. 達成徽章或給獎條件者，另由審查團隊彙整名單

審查表單與試算表權限提醒：

- 回饋／試教表單的回覆試算表必須分享給審查員，否則審查通知中的試算表連結會無法開啟
- 建議由社群管理帳號持有表單、回覆試算表與 Apps Script
- 審查員使用自己的 Google 帳號操作，方便追蹤審查紀錄
- 公開表單不應包含「審查委員」「審查狀態」「內部備註」等內部欄位；這些欄位應放在回覆試算表右側，並以保護範圍限制編輯權

技術路徑的 Pull Request 仍由維護者審查。通過後合併到 `main`，收錄為官方衍生版或公開成果。

---

## 授權須知

- 您的改編版會**自動沿用 CC BY-SA 4.0**
- 請在改編版的 `README.md` 標註原作者與您自己
- 商業使用需另行洽談（聯絡窗口見主 README）

---

## 回饋與提問

- 教學試教回饋：請從網站各教案頁面的「試教／回饋表單」提交
- 改編前構想討論：可使用 [Remix Proposal Issue Template](.github/ISSUE_TEMPLATE/remix-proposal.md)
- 技術問題或網站錯誤：可使用 GitHub Issue 回報

感謝您的參與，讓氣候變遷教育更貼近臺灣的孩子。
