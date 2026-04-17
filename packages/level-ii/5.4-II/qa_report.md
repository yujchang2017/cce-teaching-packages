# QA Report — 5.4-II (家裡的能源小精靈)

**生成日期：** 2026-04-16
**Key ID：** 5.4-II
**主題：** Energy consumption and carbon emissions (Level II, 5-8 歲)
**主角：** 電電小精靈（黃色燈泡造型）

## 各面向 QA 彙總

| 面向 | 準則通過 | 狀態 |
|---|---|---|
| data_card.json | 7/7 | ✅ |
| lesson_plan.md | 8/8 | ✅ |
| ppt_script.md | 7/7 | ✅ |
| worksheet.html (一般) | 7/7 | ✅ |
| worksheet.html (early 7 準則) | 7/7 | ✅ |

**總通過率：** 36/36 ✅

## CSV OL 覆蓋表（1231-1239，共 9 項）

| OL | 描述 | 覆蓋位置 |
|---|---|---|
| 1231 (C) | 認出家中需要能源的物品（電燈、冰箱、TV、微波爐） | lesson 第一節家電大偵探、ppt Slide 2/4、worksheet L1/L2 |
| 1232 (C) | 說出各家電用的能源類型（電／瓦斯） | lesson 第一節配對、ppt Slide 5、worksheet L2 |
| 1233 (C) | 觀察家裡與其他地方的能源使用 | lesson 第一節＋家庭延伸電器尋寶、ppt Slide 12 |
| 1234 (SE) | 體會生活依賴能源 | lesson 第二節餅乾罐、ppt Slide 3/9、繪本停電那天 |
| 1235 (B) | 跟家人分享能源種類 | lesson 第三節徽章約定、ppt Slide 12、worksheet 結尾任務 |
| 1236 (C) | scarcity 基本概念 | lesson 第二節餅乾罐、ppt Slide 9、data_card dp4 |
| 1237 (C) | 自然資源有限 | ppt Slide 8/9、data_card dp4 |
| 1238 (SE) | 願意節能 | lesson 第三節分享圈、ppt Slide 11 |
| 1239 (B) | 實際節能行為（關燈） | lesson 第三節闖關、ppt Slide 7/11、worksheet L3 |

**OL 覆蓋：9/9 全覆蓋** ✅

## 檔案清單

- data_card.json
- lesson_plan.md
- ppt_script.md
- worksheet.html
- resources.md
- qa_data.md / qa_lesson.md / qa_ppt.md / qa_worksheet.md / qa_early.md
- qa_report.md（本檔）
- _cache/5.4-II_sources.json（RAG + web + map.csv 來源）

## 來源預算執行

- RAG 查詢：3/3（家電能源、節能、稀少性）
- WebFetch：3/4（MOEAEA、Taipower、MOEAEA 404 fallback）
- map.csv：3 項引用

## 最終狀態

✅ **Complete — 5.4-II Early Level II 教學包已通過全部 36 項 QA 準則**
