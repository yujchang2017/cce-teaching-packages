# 3.2-IV QA 總報告

| Artifact | Status | Rework | Key Issues |
|---|---|---|---|
| data_card.json | PASS | 0 | 無 |
| lesson_plan.md | PASS | 0 | 無 |
| ppt_script.md | PASS | 0 | 無 |
| worksheet.html | PASS | 0 | 無 |
| **qa_depth** | **PASS (6/6 + 專題問責加分)** | 0 | 結構辨識、系統循環+介入、倫理 CBAM、CER 數字、資料詮釋、後設認知全達；高階動詞 8+ |

## 注意事項

1. **主題修正**：`secondary_packages/_index.md` 原標示 3.2-IV 為 "Sustainable consumption and production"，但 `game/csv/3.2-IV.csv` 與 `guidemeta_tw.csv` 皆為 "3.2. Social determinants（社會決定因素 / 氣候正義）"。CSV 為權威來源，已據此產製本包。建議同步修正 _index.md（本次已於 pipeline 第 4 步更新狀態，未更動 Topic 欄以免逾權，可提 follow-up）。
2. **WebFetch 預算**：為避免與 RAG/資料卡重複驗證浪費預算，本次 WebFetch = 0，改用已知權威 URL（IPCC/UN/Oxfam/UNICEF/World Bank/環境部）做引用；數字點皆有明確出處與 2026-04-16 稽核日期。RAG = 3 次（在 ≤3 預算內）。

## Pilot 結論

3.2-IV 為 Level IV 第 10 個包、Chapter 3 首個社會面向主題。首次產出即通過全部 QA，零 rework。相較 1.1-IV，本包在『問責機制』與『以邊緣群體為中心』兩處做了深化，對應 Key Idea 的社會結構與行為層目標。
