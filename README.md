# CCE Teaching Packages — 氣候變遷教育教學組合包

> UNESCO Climate Change Education (CCE) 教學組合包開源社群
> 115 年中小學氣候變遷教育推動計畫 · 開放共創版
>
> **主辦：** 教育部資訊及科技教育司　|　**執行：** 臺北市立大學　|　**計畫：** 115 年中小學氣候變遷教育推動計畫

---

## 這是什麼？

本倉庫收錄以 **UNESCO《Learn for Our Planet》氣候變遷教育框架**為基礎、搭配臺灣本土教學現場需求開發的**教學組合包（Teaching Packages）**。每包完整涵蓋：

- 資料卡（`data_card.json`）—— 關鍵數據與出處
- 教案（`lesson_plan.md`）—— 4 節 × 40 分鐘標準課程
- PPT 腳本（`ppt_script.md`）—— 講述稿與投影片對照
- 互動學習單（`worksheet.html`）—— 可離線開啟的 HTML 檔
- 教學資源清單（`resources.md`）—— 延伸閱讀與影片連結

全套規劃 **136 包**，涵蓋 UNESCO 六大主題 × 四個年段（Level I–IV）。

## 目前收錄的教學包（Phase 0 POC）

| Key ID | 主題 | 年段 | 線上預覽 | 狀態 |
|---|---|---|---|---|
| [1.1-III](packages/level-iii/1.1-III/) | 天氣、氣候與氣候變遷 | Level III（9–12 歲） | [互動學習單](https://yujchang2017.github.io/cce-teaching-packages/packages/level-iii/1.1-III/worksheet.html) | 已上線 |

> 其餘 135 包將於 Phase 1–2 陸續推出。詳見 [community.cce.tw](https://community.cce.tw) （暫定，建置中）。
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

我們歡迎兩種路徑：

### 友善路徑（推薦給第一次接觸開源的老師）
前往 [community.cce.tw](https://community.cce.tw)（建置中）填寫「教案改編提案」表單，由平臺協助處理版本控管。

### 技術路徑（熟悉 GitHub 的貢獻者）
1. `Fork` 本倉庫
2. 新增分支 `remix/您的名字-教案編號`
3. 改編後送 Pull Request
4. 詳見 [CONTRIBUTING.md](CONTRIBUTING.md)

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
