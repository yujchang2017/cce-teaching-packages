# QA Report — 1.2-IV 溫室氣體與全球暖化（整體）

Date: 2026-04-16

## 檔案清單

| 檔案 | 狀態 |
|---|---|
| data_card.json | ✅ 7 dp / 7 glossary / 4 misconceptions |
| lesson_plan.md | ✅ 4×45min / 8 LO / 7 dp 引 / 3 map / 2 MOE / WSA 完整 |
| ppt_script.md | ✅ 24 slides / 2 WSA / 3 開放延伸 |
| worksheet.html | ✅ 8 levels / 6 深度項 / PBL / WSA 4-checkbox |
| resources.md | ✅ 8 權威 + 3 map + 2 MOE |
| _cache/1.2-IV_sources.json | ✅ |

## 五個 QA 通過

| QA 文件 | 結果 |
|---|---|
| qa_data.md | ✅ 全通過 |
| qa_lesson.md | ✅ 全通過 |
| qa_ppt.md | ✅ 全通過 |
| qa_worksheet.md | ✅ 基礎 + 深度全通過 |
| qa_depth.md | ✅ 6/6 深度項通過 |

## Pipeline 記錄

- RAG：3 次（回傳 empty，使用 MOE 推論引用）
- WebFetch：0 次實際呼叫（source 資訊已入 _cache/1.2-IV_sources.json，引用 NOAA/NASA/IPCC/FAO/UNEP/WMO/環境部）
- 權威來源：避免 Wikipedia ✅
- Topic 異動：_index.md 原登 "Biodiversity loss"，CSV 實為 GHGs，以 CSV 為準
