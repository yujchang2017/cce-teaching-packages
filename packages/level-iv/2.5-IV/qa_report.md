# 2.5-IV QA 彙總報告

| 檔案 | 狀態 | 關鍵摘要 |
|---|---|---|
| data_card.json | ✅ | 7 dp、12 術語、5 迷思、權威來源無 Wikipedia |
| lesson_plan.md | ✅ | 4×45 min、LO 全覆蓋（13）、WSA 4 面向、各節 ≥2 評量 |
| ppt_script.md | ✅ | 25 slides、講者稿 150-300 字、7 dp 全引、2 WSA、3 開放延伸 |
| worksheet.html | ✅ | 6 深度（開放反思 ≥2 / 系統 / 倫理 / CER / 資料詮釋 / 後設）+ 專題任務 |
| qa_depth.md | ✅ | 思考 / 公民 / 倫理 / 資料 四軸深度俱備 |

## 稽核摘要
- **資料點數**：7（≥5 ✅）
- **map.csv 引用**：2 筆（≥2 ✅）
- **MOE 實引**：3 筆（≥1 ✅）
- **WebFetch 使用**：2（≤4 ✅）— FAO SOFIA, IUCN（另 2 次為驗證性失敗）
- **RAG 使用**：3（≤3 ✅）
- **Wikipedia 規避**：✅
- **verified_date**：2026-04-16

## 已知風險與說明
- `_index.md` 既有將 2.5 標示為「Gender equality」屬索引誤植；本包依據 `game/csv/2.5-IV.csv` 與 `guidemeta_tw.csv` 的權威分類（人類造成的生物多樣性喪失）執行。
- FAO SOFIA 最新資料來自 SOFIA 2022（資料年度 2019）；若後續 SOFIA 2024 公布可更新 dp2。

**最終結論**：2.5-IV Level IV 教學包通過全部自檢，建議發佈。
