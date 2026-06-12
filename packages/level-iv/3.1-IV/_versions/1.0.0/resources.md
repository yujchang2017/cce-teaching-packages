# 3.1-IV 資源彙整

## MOE RAG 檢索 PDF（3 次查詢）
1. 0089_KEE3_J1_氣候變化與環境.pdf — 脆弱度三要素（暴露/抵抗/恢復）、永續調適
2. 0264_CCE_IV_健康.pdf — 健康調適概念群集
3. 0271_CCE_IV_災難.pdf — 臺灣颱風與複合型災害
4. 0272_CCE_IV_維生基礎系統.pdf — 極端事件與社會結構衝擊
5. 0174_CCE_搶救糧食大作戰.pdf — 氣候難民、政權脆弱
6. 0164_CCE_地球的暖化難題.pdf — 「損失與損害」條款教學討論

## map.csv 資源
| ID | 類型 | 名稱 | URL | 用途 |
|---|---|---|---|---|
| 237 | game | SAVIOURS 氣候變遷調適遊戲 | https://climatechange.tw/Home/getFileByNewId/9b666f41-73dd-496f-95ab-9d2f88c77b8d | 第 2 節脆弱度桌遊 |
| 234 | game | 關鍵時刻 氣候變遷桌遊 | https://visionproject.org.tw/article_detail.php?id=6791 | 青少年適用 |
| 92 | game | Climate Action Game (CAFOD) | https://cafod.org.uk/education/secondary-and-youth-resources/games/climate-action-game | 弱勢族群氣候模擬 |
| 267 | curriculum | SDGs13 氣候變遷與災害 | https://www.ntsec.edu.tw/liveSupply/detail.aspx?a=6829&cat=6841&p=1&lid=20430&print=1 | 十二年國教課綱 |
| 233 | lesson plan | 消失的秘境 | https://web.ypps.tp.edu.tw/yppsweb/disaster/20161005/3/b/%E6%B6%88%E5%A4%B1%E7%9A%84%E7%A7%98%E5%A2%83.pdf | 北市氣候調適教案 |

## Web 權威數據源（WebFetch 2 次成功）
1. **UN Women** — 性別與氣候不平等數據（dp1, dp6, dp7）
   https://www.unwomen.org/en/news-stories/explainer/2022/02/explainer-how-gender-inequality-and-climate-change-are-interconnected
2. **WHO** — 氣候變遷與健康脆弱度（dp2, dp3, dp4, dp5）
   https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health

## 驗證狀態
- 所有 URL 於 2026-04-16 可達（UN Women 與 WHO Fact Sheet）
- 避開 Wikipedia（per pipeline spec）
- 資料來源全部 reliability = high（UN / WHO / IPCC AR6）
