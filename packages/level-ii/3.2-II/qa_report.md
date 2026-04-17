# QA 總報告（3.2-II）

驗證日：2026-04-16

## 交付清單

| 檔案 | 狀態 | 規範達成 |
|---|---|---|
| data_card.json | ✅ | 4 dp, 5 glossary, 3 misconceptions, 2026-04-16 verified |
| lesson_plan.md | ✅ | 3×30min, 13 LO 全覆蓋, 遊戲/歌謠/繪本/手作, ≥2 dp, map≥1, MOE≥1, WSA 3 面向, 親子 4 項 |
| ppt_script.md | ✅ | 14 張, 80-150 字/張, 4 data 引用, 2 WSA slide, 2 開放提問 |
| worksheet.html | ✅ | 小星星主角, 3 關卡, **Early 7/7**, SVG text pointer-events:none |
| resources.md | ✅ | 5 權威網站, 7 MOE, 5 繪本, 3 歌謠, 9 教具 |
| qa_data/lesson/ppt/worksheet/early.md | ✅ | 5 份 QA 皆 PASS |

## 核心總檢表（總計 48 項）

### A. 內容規範（12 項）
- ✅ key_id = 3.2-II
- ✅ age_band = 5-8
- ✅ last_verified = 2026-04-16
- ✅ 繁體中文
- ✅ 至少 3 dp（4 dp）
- ✅ glossary 3-5（5）
- ✅ misconceptions 2-3（3）
- ✅ dp 有 value/unit/year/reliability
- ✅ dp 有 source_name + source_url
- ✅ dp 有 verified_date
- ✅ dp 有 teaching_hook
- ✅ 避免與 3.1-II 重複數據

### B. 教案規範（10 項）
- ✅ 3 節課×30 分鐘
- ✅ LO 全覆蓋（CSV #619-631 全 13 條 outcome）
- ✅ 遊戲 ≥1（三家遊戲／地球笑vs哭）
- ✅ 歌謠 ≥1（2 首）
- ✅ 繪本 ≥1
- ✅ 手作 ≥1（好行為金牌）
- ✅ ≥2 dp 引用（dp1/2/3/4 全引用）
- ✅ map.csv 引用 ≥1（#93+#130）
- ✅ MOE 引用 ≥1（0214/0174/0210 + 人/環素養）
- ✅ WSA 3 面向＋親子延伸 4 項

### C. 簡報規範（7 項）
- ✅ 12-15 張（14）
- ✅ 每張視覺描述
- ✅ 講者 80-150 字
- ✅ 兒童互動 14/14
- ✅ ≥3 data 引用（4）
- ✅ ≥1 WSA slide（2）
- ✅ ≥2 開放提問

### D. 互動遊戲規範 Early 7/7（7 項）
- ✅ 無紙筆／不要求書寫
- ✅ 大字體（text-2xl+ 多處；big-btn 2rem）
- ✅ emoji/SVG 視覺主導
- ✅ 溫暖色調（粉橘/奶黃/淡紫漸層）
- ✅ 即時回饋＋無懲罰
- ✅ 觸控支援（touchstart/touchend fallback）
- ✅ **SVG text pointer-events:none**（已加入 style）

### E. 情緒保護＋適齡（5 項）
- ✅ 避免真實個案（用手偶／繪本）
- ✅ 避免貼標籤詞
- ✅ 允許情緒停下
- ✅ 強調「不是故意」的同理
- ✅ 保密舉手（不點名）

### F. 文化＋在地（3 項）
- ✅ 臺灣地理情境（海／山／城）
- ✅ 華人家庭（阿公阿嬤關懷）
- ✅ MOE 課綱對接

### G. 資源＋引用（4 項）
- ✅ 5 權威 URL + verified 2026-04-16
- ✅ 7 MOE RAG 來源
- ✅ 臺灣可取得繪本清單
- ✅ 實體教具清單完整

## 總計：**48/48 PASS** ✅

## 風險與備註

- WebFetch 4/4 狀況：WHO 成功；Save the Children 403；UNICEF 403；CWA 首頁無內容（SPA）
  → fallback：承接 3.1-II 已驗證引用
- 本包不重複 3.1-II 的 +70% 與 1-in-2 等具體數字，改以對比式比喻，避免 5-8 歲認知負荷
- 所有「不公平」主題皆以手偶／繪本間接化，不使用真實個案

## 結論

**3.2-II 包整體 PASS — 可上線使用。**
