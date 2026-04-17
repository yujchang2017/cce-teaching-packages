# 4.2-III QA 總報告

驗證日期：2026-04-16

## A. data_card.json QA — ✅ PASS
- data_points：7 筆（≥5）全部 high reliability
- glossary：8 項（≥5）
- misconceptions：5 項（≥3）
- verified_date：2026-04-16 ✓
- 來源涵蓋 CWA、WHO、TCCIP/NCDR、消防署、教育部防災網、Lancet Countdown — 全為權威機構
- URL 為公開可達 .gov / who.int / ncdr 域名

## B. lesson_plan.md QA — ✅ PASS
- 4 節 × 40 min = 160 min ✓
- LO 覆蓋：C1/C2/C3/C4、S1/S2/S3、B1/B2 全 9 項（對應 CSV #862-870）皆有對應節次標註 ✓
- data_card 具體引用：dp1、dp2、dp3、dp4、dp5、dp6、dp7 全 7 筆均於教學流程出現（≥3 ✓）
- map.csv 引用：Stop Disasters Game、UN Adapting 紀錄片 2 筆（+UNC World View 備課）（≥2 ✓）
- MOE RAG 引用：0114、0094、0096、0101、0093、0112、0105 共 7 筆（≥1 ✓）
- 形成性評量 3 項、總結性評量 2 項 ✓
- WSA 四面向齊備：課程整合/校園營運/社區連結/學生治理各 3 項具體行動 ✓
- 延伸活動段落銜接 worksheet.html §1-§6 ✓

## C. ppt_script.md QA — ✅ PASS
- Slides：22（20-25 範圍內）✓
- 每 slide 含視覺描述 + 講者稿（90-150字）+ 部分含可選提問 ✓
- data_card 具體數字使用：dp1 (S4)、dp2 (S6)、dp3 (S5)、dp4 (S13)、dp5 (S14)、dp6 (S3)、dp7 (S6) — 7 筆 ≥5 ✓
- MOE 元素融入：家庭防災卡 (S15)、1991 (S14)、避難包 (S13)
- WSA 專屬 slides：Slide 17 全校視野、Slide 18 學生能做的事 ✓
- 延伸思考：Slide 21 三個問題 ✓

## D. worksheet.html QA — ✅ PASS

### 基礎層（6 全過）
1. 單檔 HTML + Tailwind CDN ✓
2. 純前端、無外部 API 呼叫（除 Tailwind CDN），無預期 console error ✓
3. 互動類型 ≥3：選擇題（關1）、拖曳配對（關2）、多題組選擇（關3）、是非題引導錯答（關4）、情境選擇（關5）、checkbox 挑戰（關6） — 共 6 種 ✓
4. LO 覆蓋 ≥60%：C1（關1）、C2/C3（關2）、C4（關3）、S1（關4-5）、S2/S3（關5）、B1/B2（關6+結果頁計畫書）— 9 項覆蓋 8 項 ≈ 89% ✓
5. 響應式：Tailwind grid md 斷點、max-w-5xl ✓
6. 無外部依賴失效 ✓

### 動機層（5/5 全過）
- 情境故事/角色：防災阿熊任務簡報 ✓
- 關卡/分數/徽章：6 關 + 進度 dots + 全校英雄徽章 ✓
- 活潑視覺：emoji、漸層、confetti、badge glow 動畫、pulse-red ✓
- 選擇權後果：關卡 5 四選項各自回饋 ✓
- 正回饋慶祝：confetti 撒花 + feedback-pop 動畫 ✓

### 互動品質（4 全過）
- ≤2 sec 回饋：所有 click 事件即時 DOM 插入 ✓
- 引導式錯答：q1 shake+hint、q2 顯示正確分數與提示、q4 錯答顯示正解與說明 ✓
- 進度指示：6 個 progress dots + 文字 `第 N / 6 關` ✓
- 成果 + 3 延伸思考 + 家庭計畫書：result 區塊含徽章 + 延伸三問 + §4 表格 + 列印 ✓

### WSA 元素
- 關卡 6：4 checkbox 對應 curriculum/operations/community/agency 四面向 ✓
- 全選觸發「全校英雄」徽章 ✓

### 真實數據使用
- 3-4 個颱風/年、1.6°C 升溫、2,800mm 阿里山降雨、673 罹難、8 大類避難包、1991、6 個月檢查、70% 熱相關死亡增幅 — 共 ≥8 處（≥2 ✓）

## 總表
| 項目 | 狀態 |
|---|---|
| data_card.json | ✅ PASS |
| lesson_plan.md | ✅ PASS |
| ppt_script.md | ✅ PASS |
| worksheet.html | ✅ PASS |

無 BLOCKED 項目。
