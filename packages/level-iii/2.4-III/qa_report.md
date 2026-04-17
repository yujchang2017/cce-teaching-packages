# 2.4-III QA 總報告

驗證日期：2026-04-16

## A. data_card.json QA — ✅ PASS
- data_points：8 筆（≥5），全部 high reliability（8 high）
- glossary：8 項（5-8 範圍內）
- misconceptions：4 項（3-4 範圍內）
- verified_date：2026-04-16 ✓
- 來源涵蓋 FAO、IPBES、IPCC、農業部、農糧署、TBRI、水利署 — 全為權威機構（避 Wikipedia）✓
- URL 為公開可達域名（.gov.tw / .fao.org / .ipcc.ch / .ipbes.net）✓

## B. lesson_plan.md QA — ✅ PASS
- 4 節 × 40 min = 160 min ✓
- LO 覆蓋：C1/C2/C3、S1/S2、B1 全 6 項皆標註至節次 ✓
- data_card 具體引用：dp1 (第2節)、dp2 (第1節)、dp3 (第1節)、dp4 (第3節)、dp5 (第2節)、dp6 (第3節)、dp7 (第3節)、dp8 (第3節) — 8 筆全用（≥3 ✓）
- map.csv 引用：Farmers' Footsteps、神農氏時光機 2 筆（≥2 ✓）
- MOE RAG 引用：0268、0122、0204、0214 共 4 筆（≥1 ✓）
- 形成性評量 3 項、總結性評量 2 項（各 ≥2 ✓）
- WSA 四面向齊備：課程整合 / 校園營運 / 社區連結 / 學生治理 各 3-4 具體行動 ✓
- 延伸活動銜接 worksheet.html ✓

## C. ppt_script.md QA — ✅ PASS
- Slides：22（20-25 範圍內）✓
- 每 slide 含視覺描述 + 講者稿（約 100-150 字）+ 部分含可選提問 ✓
- data_card 具體數字使用：dp1 (S7)、dp2 (S5)、dp3 (S6)、dp4 (S14)、dp5 (S9)、dp6 (S12)、dp7 (S15)、dp8 (S13) — 8 筆 ≥5 ✓
- MOE 教案引用：S8《花不成，蜜不就》0204、S16《認識有機農耕作》0122、S17《食在現代》0214 ✓
- WSA 專屬 slides：S18 全校視野、S19 學生行動 ✓
- 延伸思考：S21 三個問題 ✓

## D. worksheet.html QA — ✅ PASS

### 基礎層（6 全過）
1. 單檔 HTML + Tailwind CDN ✓
2. 純前端、無外部 API（除 Tailwind CDN），無預期 console error ✓
3. 互動類型 ≥3：拖曳配對（關1）、選擇題（關2）、多題組（關3）、是非題（關4）、情境選擇（關5）、checkbox 挑戰（關6）— 6 種 ✓
4. LO 覆蓋：C1（關1、2、3）、C2（關2、3）、C3（關3、4）、S1（關5）、S2（關5）、B1（關6）— 6 項全覆蓋 ✓
5. 響應式：Tailwind grid md 斷點、max-w-5xl ✓
6. 無外部依賴失效（僅 Tailwind CDN）✓

### 動機層（5/5 全過）
- 情境故事/角色：蜜蜂小蜜任務簡報 ✓
- 關卡/分數/徽章：6 關 + 進度 dots + 全校英雄徽章 ✓
- 活潑視覺：emoji、漸層、confetti、badge glow 動畫 ✓
- 選擇權後果：關卡 5 四選項各自回饋 ✓
- 正回饋慶祝：confetti 撒花 + feedback-pop 動畫 ✓

### 互動品質（4 全過）
- ≤2 sec 回饋：所有 click 事件即時 DOM 插入 ✓
- 引導式錯答：q2 shake + hint、q4 錯答顯示正解與說明、關5 後果 ✓
- 進度指示：6 個 progress dots + 文字「第 N / 6 關」 ✓
- 成果 + 3 延伸思考：result 區塊含徽章 + 延伸三問 + 列印 ✓

### WSA 元素
- 關卡 6：4 checkbox 對應 curriculum/operations/community/agency 四面向 ✓
- 全選觸發「全校英雄」徽章 ✓

### 真實數據使用
- 75% 授粉、38% 陸地、21–23% GHG、>2 萬公頃有機、10 億微生物、>70% 農業用水、500 隻石虎 — 共 ≥7 處（≥2 ✓）

## 總表
| 項目 | 狀態 |
|---|---|
| data_card.json | ✅ PASS |
| lesson_plan.md | ✅ PASS |
| ppt_script.md | ✅ PASS |
| worksheet.html | ✅ PASS |

無 BLOCKED 項目。
