# Build-time scripts

## build-packages-index.mjs

從 GitHub `cce-teaching-packages` repo 抓所有教案資料,寫入 `web/data/`。

### Usage

```bash
# 從專案根目錄
node scripts/build-packages-index.mjs

# 或從 web/ 目錄 (npm run dev/build 會自動跑)
cd web && npm run dev
```

### 環境變數

| 變數 | 預設 | 說明 |
|---|---|---|
| `PACKAGES_REPO` | `yujchang2017/cce-teaching-packages` | 教案 repo |
| `PACKAGES_BRANCH` | `main` | 分支 |

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

## (待實作) weekly-merge.mjs

每週一審核員審完後,維護者跑此 script 把 approved 的改編合併到 cce-teaching-packages repo。

預計實作: Phase 0 Week 3。
