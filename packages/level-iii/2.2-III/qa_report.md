# 2.2-III 教學組合包 — 綜合 QA 報告

**Overall: PASS**（2026-04-16）

| 檔案 | QA | 狀態 |
|---|---|---|
| data_card.json | qa_data.md | ✅ PASS |
| lesson_plan.md | qa_lesson.md | ✅ PASS |
| ppt_script.md | qa_ppt.md | ✅ PASS |
| worksheet.html | qa_worksheet.md | ✅ PASS（runtime 待人工 Preview）|

## 關鍵指標彙總
- 三領域 LO 覆蓋：C1–C4, S1–S2, B1–B2（共 8 LO，全覆蓋）
- data_card 數據：6 筆 high reliability、全部 verified_date=2026-04-16
- map.csv 資源：3 筆 / MOE RAG：3 筆 / Web 權威：2 筆
- 形成性評量 2 種、總結性評量 2 種
- WSA 章節：四面向×3 行動（lesson_plan）＋ 2 張 WSA slides（ppt）＋ WSA Challenge 4-checkbox（worksheet）
- 互動類型：6 類（拖曳排序、點擊計時、拖曳分類、單選題、表單、checkbox）

## BLOCKED 項目
無。worksheet.html runtime 行為（拖曳/計時/分數跳轉）建議開發者在 Launch Preview 點擊一輪驗證後再部署。

## 已避開的坑
- 避免把「適應」寫成「演化」（dp6 + Level 3 明確區辨）
- 避免把「人是從黑猩猩變來」等迷思（misconceptions 已納入）
- 所有 URL 皆來自 _sources.json 或 map.csv，未自創
