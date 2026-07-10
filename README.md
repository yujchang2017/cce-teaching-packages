# CCE Teaching Packages — 氣候變遷教育教學組合包

> UNESCO Climate Change Education (CCE) 教學組合包開源社群
> 115 年中小學氣候變遷教育推動計畫 · 開放共創版
>
> **主辦：** 教育部資訊及科技教育司　|　**執行：** 臺北市立大學　|　**計畫：** 115 年中小學氣候變遷教育推動計畫

---

## 這是什麼？

本倉庫收錄以 **UNESCO (2024)《 Greening Curriculum Guidance: Teaching and learning for climate action 》綠色課程指南**為基礎、搭配臺灣本土教學現場需求開發的**教學組合包（Teaching Packages）**。每包完整涵蓋：

- 資料卡（`data_card.json`）—— 關鍵數據與出處
- 教案（`lesson_plan.md`）—— 4 單元 × 10 分鐘參考活動
- PPT 腳本（`ppt_script.md`）—— 講述稿與投影片對照
- 互動學習單（`worksheet.html`）—— 可離線開啟的 HTML 檔
- 教學資源清單（`resources.md`）—— 延伸閱讀與影片連結

全套規劃 **102 包**，涵蓋 UNESCO 六大主題 × 四個年段（Level II–IV）。

## 目前收錄的教學包

目前網站已呈現 **102 包**（Level II–IV），各年段收錄如下：

| 年段 | 包數 | 目錄入口 |
|---|---:|---|
| Level II（5–8 歲） | 34 | [packages/level-ii/](packages/level-ii/) |
| Level III（9–12 歲） | 34 | [packages/level-iii/](packages/level-iii/) |
| Level IV（13–15 歲） | 34 | [packages/level-iv/](packages/level-iv/) |

> 高中階段（Level V）內容暫未於現階段網站呈現。
>
> **線上預覽說明**：本倉庫已啟用 GitHub Pages（`https://yujchang2017.github.io/cce-teaching-packages/`）直接提供互動 HTML。請**避免**使用 `htmlpreview.github.io/?...` 連結——其 iframe sandbox 會讓 Tailwind CDN 與 drag/drop 事件失效，造成「畫面跑出來但無法互動」的情況。

## 授權

| 類別 | 授權 |
|---|---|
| 教學內容（`packages/` 底下的 .md / .json / .html） | **CC BY-SA 4.0** — 詳見 [CONTENT-LICENSE.md](CONTENT-LICENSE.md) |
| 基礎設施（repo 結構、模板、設定檔） | **MIT** — 詳見 [LICENSE](LICENSE) |

**簡言之**：您可以自由使用、改編、散布本教材，只需（1）標示原作者、（2）以相同授權分享衍生作品。

## 如何使用

### 瀏覽 / 下載
- 點進 [`packages/`](packages/) 目錄瀏覽所有教學包
- 單包下載：進入教案資料夾 → 點右上角 `Code` → `Download ZIP`（僅下載該子目錄的做法：使用 [DownGit](https://downgit.github.io/) 貼連結）
- 整倉庫下載：`git clone https://github.com/yujchang2017/cce-teaching-packages.git`

### 離線使用
所有 `worksheet.html` 為單檔 HTML，**可直接用瀏覽器打開教學**。需連網一次以載入 Tailwind CSS CDN（瀏覽器快取後可離線使用）。

### 線上互動（推薦做法）
直接點各教學包表格中的「線上預覽」連結 —— 由 GitHub Pages 原生網域提供，拖放、按鈕、動畫皆可正常運作。

## 如何參與改編

目前以 GitHub 協作為主，建議依需求走下列路徑：

### 路徑一：先提改編想法（不需先會 Git）
使用 [教案改編提案](.github/ISSUE_TEMPLATE/remix-proposal.md) Issue 模板，先描述：
1. 想改編哪一包
2. 想改哪些情境或內容
3. 預計試教對象與時程

維護者會先協助你確認方向，再決定後續是否送 PR。

### 路徑二：直接優化現有教材（PR）
如果是修正錯字、更新失效連結、補充說明等，可直接修改原檔並送 PR：
1. 進入要修改的檔案後點 GitHub 鉛筆圖示編輯
2. Commit 並建立 PR
3. 依 PR 模板填寫教案代號、修改類型與摘要

送出後會跑自動檢查；`version.json` 由維護者審查時統一補上。

### 路徑三：製作你的改編版本（Fork + PR）
適合要做在地化或教學重設計：
1. `Fork` 本倉庫
2. 建立分支（建議：`remix/你的名字-教案代號`）
3. 完成改編後送 Pull Request
4. 詳見 [CONTRIBUTING.md](CONTRIBUTING.md)

> 若要先回報試教使用經驗，可用 [教學回饋](.github/ISSUE_TEMPLATE/feedback.md) Issue 模板。

### 遇到問題？
使用 [Issue 模板](.github/ISSUE_TEMPLATE/) 提出教學回饋或改編提案。

## Contributors

*（待第一位改編者加入）*

原作：115 年中小學氣候變遷教育推動計畫團隊 · 2026-04-16

---

**主辦機關**：教育部資訊及科技教育司
**執行單位**：臺北市立大學
**計畫名稱**：115 年中小學氣候變遷教育推動計畫
**聯絡窗口**：（暫定，待 community.cce.tw 上線後公告）
