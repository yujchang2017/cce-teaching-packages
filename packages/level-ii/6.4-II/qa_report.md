# QA 總報告 — 6.4-II 永續的生活空間

**驗證日期：** 2026-04-16
**主題：** Sustainable living spaces (5-8 歲)
**主角：** 小鼴鼠阿土

## 五份 QA 結果彙總

| QA 檔案 | 檢查項數 | 通過 | 狀態 |
|---|---|---|---|
| qa_data.md | 8 | 8 | ✅ ALL PASS |
| qa_lesson.md | 11 | 11 | ✅ ALL PASS |
| qa_ppt.md | 9 | 9 | ✅ ALL PASS |
| qa_worksheet.md | 11 | 11 | ✅ ALL PASS |
| qa_early.md (Depth 7) | 7 | 7 | ✅ ALL PASS |
| **合計** | **46** | **46** | **✅ 100%** |

## 立即修正紀錄
- 第一輪草稿：worksheet.html 關卡 1 原本只做 1 題，改為 4 好朋友 4 題循環 → 符合「4 個好朋友全部涵蓋」學習目標
- 第一輪草稿：關卡 3 判斷原為「全部都選 true 即可」，改為「恰好選 3 個且全對」→ 更符合 PPT slide 10 的「3 個挑戰」
- 加強 `svg * { pointer-events: none; }` 避免 SVG 圖示擋住 button/dropzone 的點擊（early 準則第 6 項關鍵）

## 資料完整性
- **LOs 覆蓋：** CSV outcome 1495-1504 共 10 條目標，lesson_plan 7 個學習目標覆蓋認知/社會情緒/行動三領域
- **data_card：** 4 個 dp，全部 verified 2026-04-16，全部 reliability=high
- **map.csv 引用：** #80 Games for Change（1 筆）
- **MOE RAG：** 0264、0200、0016、0159、0272、0128（6 筆 MOE 素材）
- **WebFetch：** WHO（成功）／ABRI（部分）；2 筆失敗由 RAG 補強

## 情緒保護檢核
- ✅ 未出現「窮／富／破／爛」等評價詞
- ✅ Slide 11「有人沒有好家園」使用關心愛心圖示，不用悲傷畫面
- ✅ Lesson plan 教師備註明確提醒情緒敏感孩子處理方式
- ✅ 「多元家」概念：slide 2 展示 5 種不同家型（公寓／透天／鄉下／原住民／山邊），皆平等尊重

**總結：全部檢核通過，可交付使用。**
