# II 學習單注音工具

II（5–8 歲）的 34 份 `worksheet.html` 有注音與朗讀功能：
- 網頁載入 `web/public/zhuyin/cce-zhuyin.js`，上方有「ㄅㄆㄇ 注音」「🔊 朗讀」開關（預設：注音開、朗讀關；網址可加 `?zhuyin=0/1`、`?tts=0/1`）。
- 破音字後面有看不見的 IVS 讀音記號（U+E01E1 起），讓注音字型顯示正確讀音；沒有注音字型時瀏覽器會忽略它。

## 改了學習單文字之後

```
pip install -r scripts/zhuyin/requirements.txt
python scripts/zhuyin/apply_zhuyin.py              # 重新標音（冪等，只加不改）
python scripts/zhuyin/apply_zhuyin.py --check      # 只檢查
python scripts/zhuyin/apply_zhuyin.py --report out # 輸出每份的破音字紀錄，方便人工抽查
```
若提示有字不在字型內，再跑 `python scripts/zhuyin/build_font.py`。

## 標音原則（計畫主持人裁定，2026-10-08）
- 「一、不」標變調（一/不＋第四聲→ㄧˊ/ㄅㄨˊ；一＋一二三聲→ㄧˋ）；序數、數字、句尾、「看一看」中間的一標ㄧ
- 疊字稱謂與「謝謝」第二字輕聲；「和」作連接詞標ㄏㄢˋ
- 數字後的「個」、「哪個、每個」標˙ㄍㄜ；「這個、那個」標ㄍㄜˋ
- 「做得到」的得標ㄉㄜˊ，其他「動詞＋得」標˙ㄉㄜ；「關卡」標ㄎㄚˇ；「沒關係」標˙ㄒㄧ
- 個別修正寫在 `overrides.csv`（以「前後文」比對，【】內為該字）

## 資料與授權
| 項目 | 來源 | 授權 | 是否發布 |
|---|---|---|---|
| 注音字型（縮減字集） | 源泉注音圓體 v1.500，ButTaiwan/bpmfvs | SIL OFL 1.1 | 是，`web/public/zhuyin/`，附授權檔 |
| 字型讀音表 | bpmfvs `phonetic/phonic_table_Z.txt`（固定版本） | Apache 2.0 | 否，執行時下載到 `.cache/` |
| 詞語讀音 | 新酷音 libchewing-data `tsi.csv`（固定版本） | LGPL-2.1-or-later | 否，執行時下載到 `.cache/` |
| pypinyin | PyPI | MIT | 否 |
