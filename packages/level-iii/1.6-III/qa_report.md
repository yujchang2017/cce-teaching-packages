# 1.6-III QA 總報告

驗證日期：2026-04-16

## A. data_card.json QA — ✅ PASS
- data_points：7 筆（≥5）— 6 high + 1 medium
- glossary：9 項（≥5）
- misconceptions：4 項（≥3）
- verified_date：2026-04-16 ✓
- 來源涵蓋 IEA、Ember、IPCC、經濟部能源署、國發會、FAO、UNESCO — 全為權威機構
- 避免 Wikipedia；URL 均為 .iea.org / .ipcc.ch / .moeaea.gov.tw / .ndc.gov.tw / .fao.org / .unesdoc.unesco.org

## B. lesson_plan.md QA — ✅ PASS
- 4 節 × 40 min = 160 min ✓
- LO 覆蓋：C1/C2/C3、S1/S2、B1/B2 全 7 項（對齊 csv id 239-245）皆標註對應節次 ✓
- data_card 具體引用：dp1、dp2、dp3、dp4、dp5、dp6、dp7 全 7 筆於教學流程出現（≥3 ✓）
- map.csv 引用：UN Global Goals、《電力世界》桌遊、兒盟影音 3 筆（≥2 ✓）
- MOE RAG 引用：0292、0297、0137、0173、0147（第1、2、4節出現），共 5 筆（≥1 ✓）
- 形成性評量 3 項、總結性評量 2 項 ✓
- WSA 四面向齊備：課程整合/校園營運/社區連結/學生治理各 3 具體行動 ✓
- 延伸活動段落銜接 worksheet.html ✓

## C. ppt_script.md QA — ✅ PASS
- Slides：22（20-25 範圍內）✓
- 每 slide 含視覺描述 + 講者稿（100-150字）+ 多張含可選提問 ✓
- data_card 具體數字使用：dp1 (Slide 4)、dp2 (5)、dp3 (11)、dp4 (13)、dp5 (14)、dp6 (9)、dp7 (16) — 7 筆 ≥5 ✓
- MOE 教案引用：Slide 15《生活中的綠電》0292、0297 ✓
- WSA 專屬 slides：Slide 17 全校視野、Slide 18 學生行動 ✓
- 延伸思考：Slide 21 三個問題 ✓

## D. worksheet.html QA — ✅ PASS

### 基礎層（6 全過）
1. 單檔 HTML + Tailwind CDN ✓
2. 純前端、無外部 API、無預期 console error ✓
3. 互動類型 ≥3：選擇題、拖曳分類、計算題、是非題、情境選擇、checkbox 挑戰（6 種）✓
4. LO 覆蓋 ≥60%：C1（關1、2）、C2（關2）、C3（關4 Q2生質能）、S1/S2（關5、6）、B1（關6）、B2（延伸）— 7 項中覆蓋 7 項 = 100% ✓
5. 響應式：Tailwind grid md 斷點、max-w-5xl ✓
6. 無外部依賴失效（僅 Tailwind CDN）✓

### 動機層（5/5 全過）
- 情境故事/角色：機器人光光能量不足任務 ✓
- 關卡/徽章：6 關 + 進度 dots + 全校英雄徽章 ✓
- 活潑視覺：emoji、漸層、confetti、badge glow 動畫 ✓
- 選擇權後果：關卡 5 四選項差異化回饋 ✓
- 正回饋慶祝：confetti 撒花 + feedback-pop 動畫 ✓

### 互動品質（4 全過）
- ≤2 sec 回饋：所有 click 即時 DOM 插入 ✓
- 引導式錯答：q1 shake + hint、q3 計算錯提示公式、q4 錯答顯示正解說明 ✓
- 進度指示：6 個 progress dots + 文字 `第 N / 6 關` ✓
- 成果 + 3 延伸思考：result 區塊含徽章 + 延伸三問 + 列印 ✓

### WSA 元素
- 關卡 6：4 checkbox 對應 curriculum/operations/community/agency 四面向 ✓
- 全選觸發「全校英雄」徽章 ✓

### 真實數據使用
- 30% 全球再生、11.6% 台灣、14 GW 太陽光電、0.495 kg CO2/kWh、149 kg 計算、20% 2025 目標、15-25% 省冷氣 — ≥7 處（≥2 ✓）

## 總表
| 項目 | 狀態 |
|---|---|
| data_card.json | ✅ PASS |
| lesson_plan.md | ✅ PASS |
| ppt_script.md | ✅ PASS |
| worksheet.html | ✅ PASS |

無 BLOCKED 項目。
