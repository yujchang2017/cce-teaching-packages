# 6.6-IV 永續飲食 · 統合 QA 報告

**套件版本**：Inline Level IV Pipeline 6.6-IV
**對象**：國中 13–15 歲（secondary depth）
**語言**：zh-TW
**驗證日期**：2026-04-16
**參考範本**：secondary_packages/1.1-IV/

## 交付清單
| 檔案 | 狀態 |
|---|---|
| data_card.json | ✅（7 dp、glossary ×6、misconceptions ×5、WSA 四面向、9/9 LO）|
| lesson_plan.md | ✅（4×45min、9/9 LO、5 dp、map ×3、WSA 四面向、學生治理小內閣）|
| ppt_script.md | ✅（25 slides、講者稿 150–300 字、5 data slides、2 WSA、≥6 開放延伸）|
| worksheet.html | ✅（基礎 Q1–Q3；6 深度：開放反思 Q8/Q9、系統 Q6、倫理 Q7、CER Q5、資料 Q4、後設 Q10；專題 A–E）|
| qa_data.md / qa_lesson.md / qa_ppt.md / qa_worksheet.md / qa_depth.md | ✅ |
| resources.md | ✅ |
| _cache/6.6-IV_sources.json | ✅ |

## 管線指標
- RAG 查詢：3（符合 ≤3 上限）
- WebFetch：3 次成功 + 1 次 403（UNEP，已用 Our World in Data 替代，符合 ≤4 上限）
- 避 Wikipedia：✅（全為 eatforum.org、ourworldindata.org、fao.org、moa.gov.tw、教育部）
- 本地脈絡：糧食自給率、臺灣食物銀行、MOE CCE 教案群、map.csv 三筆

## 涵蓋檢核
- UNESCO LO（CSV 1614–1622）：9/9 ✅
- WSA 四面向：治理、教學、設施、社群 ✅
- 六深度面向：開放反思 ×2、系統思考、倫理、CER、資料、後設 ✅
- 學生治理：班級永續飲食小內閣＋30 天計畫 ✅

## 風險與備註
- dp4（1 kg 牛肉 36.4 kg CO₂）與國際研究數值存在尺度差；已於 data_card 標 reliability=medium，教師引導時宜說明估算法差異。
- UNEP Food Waste Index 2024 官方頁回應 403，來日可補；現以 FAO FLW 平台＋Our World in Data 替代充分。

## 結論
6.6-IV 套件**通過全部檢核**，可進入 `_index.md` 標記為 ✅。
