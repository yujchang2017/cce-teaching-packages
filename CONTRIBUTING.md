# 如何參與改編

歡迎老師、教育工作者、學生、家長一起把這些教案改成更適合您現場的樣子。我們提供兩種參與路徑：

---

## 路徑一：友善路徑（推薦給不熟悉 GitHub 的夥伴）

等 [community.cce.tw](https://community.cce.tw) 平臺上線後，您可以：

1. 註冊平臺帳號
2. 在想改編的教案頁面點「我要改編這一包」
3. 填寫改編提案表（主題、試教對象、預計完成時間）
4. 在平臺的編輯器直接改教材，平臺會自動幫您建立版本
5. 完成後按「送出」，社群審查後收錄

**不需要懂 Git、不需要裝任何軟體**。

> community.cce.tw 預計 2026 Q3 上線，請關注本倉庫 Release 公告。

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
- 維護者 5 個工作天內初審
- 通過後合併到 `main`，收錄為官方衍生版
- 在原版的「改編歷程（Fork Tree）」區段登錄您的版本

---

## 授權須知

- 您的改編版會**自動沿用 CC BY-SA 4.0**
- 請在改編版的 `README.md` 標註原作者與您自己
- 商業使用需另行洽談（聯絡窗口見主 README）

---

## 回饋與提問

- 教學試教回饋：使用 [Feedback Issue Template](.github/ISSUE_TEMPLATE/feedback.md)
- 改編前構想討論：使用 [Remix Proposal Issue Template](.github/ISSUE_TEMPLATE/remix-proposal.md)

感謝您的參與，讓氣候變遷教育更貼近臺灣的孩子。
