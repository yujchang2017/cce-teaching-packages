# 資源清單 (3.3-II — 時光小貓咪咪的故事)

## 一、官方／權威數據來源（已驗證 2026-04-16）

| # | 來源 | URL | 資料用途 |
|---|---|---|---|
| 1 | 原住民族委員會 (CIP) | https://www.cip.gov.tw/zh-tw/index.html | 16 族、阿美族 236,939 人、8 月 1 日原住民族日 (dp1, dp2, dp3) |
| 2 | 林業及自然保育署 — 森林資源調查 | https://if.forest.gov.tw/IF/FResourceArchive/ArchiveHome/ArchiveIndex | 臺灣森林覆蓋率 ~60% (dp4) |
| 3 | UN Sustainable Development Goals | https://www.un.org/sustainabledevelopment/sustainable-development-goals/ | SDG 10 / 13 / 16 對應 |

## 二、MOE 本地教材（map.csv 引用）

| map.csv row | 類型 | 標題 | URL | 用途 |
|---|---|---|---|---|
| 106 | Curriculum | Climate & History 課綱 | https://history.barnard.edu/sites/default/files/inline-files/HIST%20BC2366%20Climate%20%26%20History_0.pdf | 教師備課背景：氣候與歷史 |
| 214 | Lesson Plan | 氣候變遷教育教師手冊（MOE 防災） | https://disaster.moe.edu.tw/MOE_FILE/daolpU/teachingMaterial/2022/TM20220321031336951/氣候變遷教育教師手冊_final.pdf | 教師手冊背景補充 |

## 三、本地 RAG 檢索命中（source_documents）

| # | 檔案 | 關鍵詞 | 用途 |
|---|---|---|---|
| 1 | 0044_KEE1_U6_被忽視的生態智慧.pdf | 原住民 + 土地倫理 + 永續 | 教師備課：原住民生態智慧 |
| 2 | 0205_CCE_蓋亞傳奇-話說從頭.pdf | 里山倡議 + 人類聚落 + 生態系 | 教師備課：里山概念 |
| 3 | 0054_KEE2_E18_改變世界的力量.pdf | 資產今昔 + 氣候變遷歷史 | 教師備課：古蹟／環境變遷 |
| 4 | 0034_KEE1_J5_我是環境小達人.pdf | 人類活動 + 環境乘載力 + 永續 | 教師備課：人與環境 |
| 5 | 0186_CCE_消除「餓」勢力.pdf | 弱勢關懷 + 惜食 | 教師備課：關懷他人 |

## 四、教師延伸閱讀建議

1. **布農族生態智慧**（環境資訊中心）— https://e-info.org.tw/node/37011
2. **臺灣原住民族繪本推薦書單**：可向地方圖書館索取原住民族主題繪本清單
3. **阿美族豐年祭影音資料**：於 YouTube 搜尋「阿美族豐年祭」可找到官方紀錄

## 五、教具與手作資源建議

| 活動 | 需要材料 | 備註 |
|---|---|---|
| 第 1 節 時光三格卡 | A4 對折紙、蠟筆、貼紙 | 每人一份 |
| 第 1 節 時光接龍大卡 | A3 大圖卡 3 張（嬰兒車、小朋友、老人） | 自製即可 |
| 第 2 節 餅乾事件 | 2 隻布偶、10 個玩具餅乾 | 布偶可替換 |
| 第 2 節 臺灣地圖+16 貼紙 | 臺灣地圖海報、16 枚小貼紙 | 1 張可共用 |
| 第 3 節 咪咪種樹貼畫 | 大樹底稿、12 種行動貼紙 | 每人一份 |
| 第 3 節 守護徽章 | 圓形金色貼紙 | 每人一份 |

## 六、檔案結構

```
early_packages/3.3-II/
├── data_card.json       (4 個 data point，5 glossary，3 misconceptions)
├── lesson_plan.md       (3 節 × 30 min，全 CSV LO 覆蓋)
├── ppt_script.md        (14 slides，80-150 字/slide)
├── worksheet.html       (3 關卡互動，Early 7/7)
├── resources.md         (本文件)
├── qa_data.md           (data card QA)
├── qa_lesson.md         (lesson plan QA)
├── qa_ppt.md            (PPT QA)
├── qa_worksheet.md      (worksheet QA)
├── qa_early.md          (Early 7 準則 QA)
└── qa_report.md         (總體品質報告)
```

**最後驗證：** 2026-04-16
