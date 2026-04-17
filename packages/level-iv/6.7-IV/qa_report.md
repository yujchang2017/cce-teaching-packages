# 6.7-IV 綜合 QA 報告

- 單元：6.7 永續廢棄物處理實踐｜Level IV（13-15）
- 完成日：2026-04-16
- 狀態：✅ 全數通過

## 通過檢核
| 項目 | 結果 | 細節 |
|---|---|---|
| data_card ≥ 5 dp + glossary + misconceptions + teaching_hook | ✅ | 7 dp, 8 glossary, 5 misconceptions |
| lesson_plan 4×45 min + LO 全覆蓋 + ≥3 dp + map.csv ≥2 + MOE ≥1 + WSA 四面向 + 學生治理深化 + 評量各≥2 | ✅ | 全符合 |
| ppt_script 22-28 slides + 每張 150-300 字 + ≥5 data + 2 WSA + 3 開放延伸 | ✅ | 25 slides |
| worksheet 6 深度 + 專題任務 | ✅ | 見 qa_depth.md |
| 資料卡數據源可追溯 + 2026-04-16 驗證 | ✅ | UNEP/EU/環境部/資科司/ZWIA |

## RAG 與權威源
- 3 RAG 查詢（永續廢棄物、5R、回收優先順序）命中資科司與 CCE 教材。
- 2 WebFetch（環境部主頁 OK、UNEP 官網 403 已以引用 API/報告 URL 補）。
- map.csv 引用 5 項。

## 限制
- UNEP GWMO 2024 直接 PDF 下載受限 (403)，但其報告與新聞稿數據已透過 UNEP 官方頁與公開引用進入 dp2/dp7，並標註來源 URL。
- 田野訪談需事前協調，第 3 節節奏需教師彈性調整。

## 檔案清單
- data_card.json / lesson_plan.md / ppt_script.md / worksheet.html / resources.md
- qa_data.md / qa_lesson.md / qa_ppt.md / qa_worksheet.md / qa_depth.md / qa_report.md
- _cache/6.7-IV_sources.json
