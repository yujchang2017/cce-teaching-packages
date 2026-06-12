# 2.1-III QA 總報告

驗證日期：2026-04-16

## A. data_card.json QA — ✅ PASS
- data_points：7 筆（≥5）全部 high/medium reliability（6 high, 1 medium）
- glossary：8 項（≥5）
- misconceptions：4 項（≥3）
- verified_date：2026-04-16 ✓
- 來源涵蓋 IPBES、NOAA、TaiBIF、HKBWS、農業部生多所、US EPA — 全為權威機構
- URL 為公開可達域名（.gov / .ipbes.net / noaa / hkbws / tbri）

## B. lesson_plan.md QA — ✅ PASS
- 4 節 × 40 min = 160 min ✓
- LO 覆蓋：C1/C2/C3、S1/S2、B1/B2/B3/B4 全 9 項皆有對應節次標註 ✓
- data_card 具體引用：dp1、dp2、dp3、dp4、dp5、dp6、dp7 全 7 筆均於教學流程出現（≥3 ✓）
- map.csv 引用：NASA Climate Kids、Subject to Climate 2 筆（≥2 ✓）
- MOE RAG 引用：0287、0019、0018、0016 共 4 筆（≥1 ✓）
- 形成性評量 3 項、總結性評量 2 項（各≥2 ✓）
- WSA 四面向齊備：課程整合/校園營運/社區連結/學生治理各 2-3 具體行動 ✓
- 延伸活動段落銜接 worksheet.html ✓

## C. ppt_script.md QA — ✅ PASS
- Slides：22（20-25 範圍內）✓
- 每 slide 含視覺描述 + 講者稿（90-200字）+ 部分含可選提問 ✓
- data_card 具體數字使用：dp1 (Slide 3)、dp2 (4)、dp3 (6)、dp4 (8)、dp5 (9)、dp6 (14)、dp7 (10) — 7 筆 ≥5 ✓
- MOE 教案引用：Slide 15《歡迎來我家》0016 ✓
- WSA 專屬 slides：Slide 17 全校視野、Slide 18 學生行動 ✓
- 延伸思考：Slide 21 三個問題 ✓

## D. worksheet.html QA — ✅ PASS

### 基礎層（6 全過）
1. 單檔 HTML + Tailwind CDN ✓
2. 純前端、無外部 API 呼叫（除 Tailwind CDN），無預期 console error ✓
3. 互動類型 ≥3：選擇題、拖曳配對、多題組選擇、情境選擇、checkbox 挑戰（≥5 種）✓
4. LO 覆蓋 ≥60%：C1（關1、2）、C2（資料卡連結）、C3（關3）、S1（情境）、B1/B3（關6）、B4（延伸思考）— 9 項中覆蓋 7 項 ≈ 78% ✓
5. 響應式：Tailwind grid md 斷點、max-w-5xl ✓
6. 無外部依賴失效（僅 Tailwind CDN）✓

### 動機層（5/5 全過）
- 情境故事/角色：石虎阿花任務簡報 ✓
- 關卡/分數/徽章：6 關 + 進度 dots + 全校英雄徽章 ✓
- 活潑視覺：emoji、漸層、confetti、badge glow 動畫 ✓
- 選擇權後果：關卡 5 四選項各自回饋 ✓
- 正回饋慶祝：confetti 撒花 + feedback-pop 動畫 ✓

### 互動品質（4 全過）
- ≤2 sec 回饋：所有 click 事件即時 DOM 插入 ✓
- 引導式錯答：q1 shake + hint、q4 錯答顯示正解與說明 ✓
- 進度指示：6 個 progress dots + 文字 `第 N / 6 關` ✓
- 成果 + 3 延伸思考：result 區塊含徽章 + 延伸三問 + 列印 ✓

### WSA 元素
- 關卡 6：4 checkbox 對應 curriculum/operations/community/agency 四面向 ✓
- 全選觸發「全校英雄」徽章 ✓

### 真實數據使用
- 石虎 500 隻、870 萬物種、62,000 原生種、25% 特有種、6,988/4,135 黑面琵鷺、珊瑚 <1%/>25%、10%綠地→1°C — 共 ≥7 處（≥2 ✓）

## 總表
| 項目 | 狀態 |
|---|---|
| data_card.json | ✅ PASS |
| lesson_plan.md | ✅ PASS |
| ppt_script.md | ✅ PASS |
| worksheet.html | ✅ PASS |

無 BLOCKED 項目。
