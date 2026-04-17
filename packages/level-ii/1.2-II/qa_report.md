# QA 總報告 — 1.2-II (Level II, 5-8 歲)

- **主題：** Greenhouse Gases（溫室氣體）
- **關鍵概念：** 太陽把地球曬暖，空氣中一些看不見的氣體像「大棉被」把熱留住；棉被太厚 → 地球發燒。
- **產出日期：** 2026-04-16
- **年齡層：** 5-8 歲
- **主角：** 小星星奈奈（貫穿 worksheet）

## 總體狀態：**PASS**

| 檢核項目 | 子檔案 | 狀態 |
|---|---|---|
| 資料卡 | qa_data.md | PASS (10/10) |
| 教學計畫 | qa_lesson.md | PASS (10/10) |
| PPT 講稿 | qa_ppt.md | PASS (10/10) |
| 學習單（技術） | qa_worksheet.md | PASS (12/12) |
| Early Depth 7 準則 | qa_early.md | PASS (7/7) |

## LO 覆蓋（CSV 9 行 outcome → 3 領域）
從 `game/csv/1.2-II.csv` 抓出 9 筆 outcome，對應：
- **Cognitive（4 項）：** id 38（太陽熱證據，手/石頭）、39（GHGs 像毛毯保暖）、40（一天/季節氣溫感覺）、41（GHGs 過多會太熱）
- **Social-emotional（2 項）：** 42（對太陽溫暖讚嘆）、43（對北極熊/人類受害的關心）
- **Behavioural（3 項）：** 44（提醒家人 GHGs 排放）、45（述說太陽故事）、46（戶外「跟著太陽走」遊戲）

教學計畫第 1 節主要對應 Cognitive（手心熱熱）與 Social-emotional（太陽讚嘆）；
第 2 節對應 Cognitive（棉被比喻）；
第 3 節對應 Social-emotional（北極熊同理）與 Behavioural（走路 vs 車車）+ 親子延伸。
三領域完整覆蓋 ✅。

## 與 1.2-III（9-12 歲）設計差異
1. **概念深度：** 1.2-III 引入化石燃料、-18°C/15°C 具體數字、自然 vs 人為 GHGs 區分；1.2-II 全以「大棉被 / 大冰箱 / 發燒」比喻，無抽象數字。
2. **互動形式：** 1.2-III 可用論證、實驗設計、討論；1.2-II 採歌謠、戶外感受、拖拉、塗色、滑桿。
3. **評量方式：** 1.2-III 允紙筆測驗；1.2-II 僅觀察／作品／口說。
4. **主角：** 1.2-II 新增「小星星奈奈」貫穿 worksheet 7 處；1.2-III 無此需求。
5. **情緒處理：** 1.2-II 對北極熊題目採正向「想幫忙」導向，不強化災害畫面；1.2-III 可討論實際後果。

## 預算使用
- RAG 查詢：3 / 3（用盡）
- WebFetch：3 / 4（NASA Kids 成功、CWA 首頁成功、ecokids.moenv 失敗、climate.gov.tw 拒絕；1 次預算未用）
- 均在預算內 ✅

## 產出清單
```
early_packages/1.2-II/
  data_card.json        (4 dp, 5 glossary, 3 misconceptions)
  lesson_plan.md        (3×30 min, 三領域全覆蓋, WSA, 親子延伸 3)
  ppt_script.md         (14 slides, 5 data-slide, 1 WSA, 2 開放提問)
  worksheet.html        (4 關卡, 奈奈貫穿 7 處, early 7/7)
  resources.md
  qa_data.md
  qa_lesson.md
  qa_ppt.md
  qa_worksheet.md
  qa_early.md
  qa_report.md          ← (this file)
early_packages/_cache/
  1.2-II_sources.json
```
