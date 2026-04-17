# QA Report — 1.3-II 碳循環（5-8 歲）

驗證日期：2026-04-16
執行者：Inline 1.3-II 自檢流程

## 整體結論
✅ **通過** — 所有 5 份 QA 檢核表（data/lesson/ppt/worksheet/early）全部通過，無阻斷性問題。

## 各檔驗證摘要

| 檔案 | 關鍵指標 | 結果 |
|---|---|---|
| `data_card.json` | 4 dp、5 glossary、3 misconceptions、WSA 三面向、verified 2026-04-16 | ✅ |
| `lesson_plan.md` | 3×30 min、6 LO 全覆蓋、遊戲/歌謠/繪本/手作、≥2 dp 比喻、map+MOE、WSA、親子 3 項、四類評量 | ✅ |
| `ppt_script.md` | 13 slides、講稿 90-140 字、互動✨、4 dp 全引用、1 WSA slide、2 開放提問 | ✅ |
| `worksheet.html` | 主角綠綠、3 關卡、拖曳+點擊+多選、大字/emoji/溫暖色、即時回饋+溫柔錯提、成就+親子 3 項、SVG text pointer-events:none | ✅ |
| `qa_early.md` | 跨檔一致（語言/比喻/主角）、認知負荷 OK、不出現化學式、情感非說教、身體與手作比例足夠 | ✅ |

## LO 對應表（CSV 全覆蓋）

| CSV # | 面向 | 教案對應 |
|---|---|---|
| 85 | 認知 | 節 1 LO1 + ppt Slide 3,4 + 關卡 1 |
| 86 | 認知 | 節 2 LO2 + ppt Slide 5,6 + 關卡 2 |
| 87 | 認知 | 節 2 末 LO3 + ppt Slide 8,9 |
| 88 | 社會情感 | 節 1 圍圈分享 + ppt Slide 13 |
| 89 | 行為 | 節 3 種種子 + worksheet 回家任務 |
| 90 | 行為 | 節 3 承諾卡 + 關卡 3 + 回家任務 |

## 來源覆蓋
- ≥2 MOE：0268、0178、0206、0150
- ≥2 Web：NASA Science Kids、林業及自然保育署、環境資訊中心
- ≥1 map.csv：138、203、63

## 自檢發現與處理
1. worksheet 的 SVG 子文字（CO2/O2/☀）若未設定 `pointer-events:none`，會在觸控拖曳時截獲事件 → **已於 CSS 加上** `svg text { pointer-events: none; }`。
2. 拖曳不成功的備援 → **已加 click 偵聽**，點擊 CO2 也可被「吃掉」。
3. 初稿曾寫「光合作用」，已改為「葉子吸管/魔法變變變」以符合 5-8 歲認知。

## 結論
1.3-II 早期（5-8 歲）套件完整交付，覆蓋 CSV 6 條 LO、符合 UNESCO ESD、整合 WSA 三面向，並透過 map.csv + MOE + NASA/林業署權威來源三重驗證。
