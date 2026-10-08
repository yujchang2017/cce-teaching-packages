"""II 學習單注音標音核心：在破音字後插入 IVS 選擇子，讓注音字型顯示正確讀音。

讀音來源（依優先序）：
  1. OVERRIDES：人工覆核修正（overrides.csv，以前後文比對）
  2. RULES／標音原則：使用者裁定（變調、量詞輕聲、連接詞「和」等）
  3. 新酷音詞庫 tsi.csv（台灣詞語讀音），候選限縮在字型讀音表內
  4. pypinyin 詞語讀音（僅在新酷音有多個候選時用來挑選）
  5. 字型預設（第一讀音）
由 apply_zhuyin.py 呼叫；資料檔第一次執行時自動下載到 .cache/（固定版本）。
"""
import csv, os, re, sys, urllib.request
from collections import defaultdict
from pypinyin import lazy_pinyin, Style

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache')
# 固定版本，讓每次標音結果一致
DATA = {
    # 注音 IVS 字型讀音表（ButTaiwan/bpmfvs，Apache 2.0）：讀音順序決定 IVS 選擇子編號，必須與字型 v1.500 一致
    'phonic_table_Z.txt': 'https://raw.githubusercontent.com/ButTaiwan/bpmfvs/fa20c2bb5e2986856974f00c93a662d0805c92a0/phonetic/phonic_table_Z.txt',
    # 新酷音詞庫（chewing/libchewing-data，LGPL-2.1-or-later）：只在本機查詢，不隨網站發布
    'tsi.csv': 'https://raw.githubusercontent.com/chewing/libchewing-data/c44e81aef24b06f1509f19e1be54c99812d0c43f/dict/chewing/tsi.csv',
}

def data_path(name):
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        print(f'下載 {name} …', file=sys.stderr)
        urllib.request.urlretrieve(DATA[name], path + '.part')
        os.replace(path + '.part', path)
    return path

HAN = re.compile(r'[㐀-鿿]+')

# ---- 字型讀音表：字 -> [讀音1, 讀音2, ...]
PT = {}
for line in open(data_path('phonic_table_Z.txt'), encoding='utf-8'):
    p = line.rstrip('\n').split('\t')
    if len(p) >= 4:
        PT[p[0]] = p[3:]

def norm(z):
    """新酷音/pypinyin 輕聲寫在後面（ㄇㄜ˙），字型表寫在前面（˙ㄇㄜ）。"""
    if z.endswith('˙'):
        return '˙' + z[:-1]
    return z

# ---- 新酷音詞庫：詞 -> set(讀音串)
TSI = defaultdict(set); FREQ = {}
for row in csv.reader(open(data_path('tsi.csv'), encoding='utf-8')):
    if not row or row[0].startswith('#') or len(row) < 3:
        continue
    w = row[0]
    if len(w) < 2:
        continue
    zs = tuple(norm(z) for z in row[2].split(' '))
    if len(zs) != len(w):
        continue
    TSI[w].add(zs)
    FREQ[w] = max(FREQ.get(w, 0), int(row[1] or 0))
MAXW = 6

# ---- 人工規則：(詞, 字在詞中的位置, 讀音)。詞比新酷音優先。
RULES = [
    # 「著」接在動詞後是輕聲 ˙ㄓㄜ（字型預設即是），這裡把新酷音誤判的詞改回
    ('穿著', 1, '˙ㄓㄜ'), ('看著', 1, '˙ㄓㄜ'), ('拿著', 1, '˙ㄓㄜ'), ('帶著', 1, '˙ㄓㄜ'),
    ('跟著', 1, '˙ㄓㄜ'), ('想著', 1, '˙ㄓㄜ'), ('等著', 1, '˙ㄓㄜ'), ('坐著', 1, '˙ㄓㄜ'),
    ('睡著', 1, 'ㄓㄠˊ'), ('著火', 0, 'ㄓㄠˊ'), ('著急', 0, 'ㄓㄠˊ'), ('著涼', 0, 'ㄓㄠˊ'),
    # 動詞＋得（結構助詞）讀輕聲；「得到、得分、獲得」的得維持 ㄉㄜˊ
    *[(v + '得', 1, '˙ㄉㄜ') for v in ['覺', '記', '值', '懂', '捨', '曉', '做', '跑', '吃', '長', '變', '來', '說',
                                         '玩', '看', '聽', '走', '飛', '弄', '過', '洗', '穿', '寫', '畫', '唱', '跳',
                                         '睡', '活', '住', '用', '省', '多', '少', '大', '小', '快', '慢', '好', '熱', '冷']],
    ('高興', 1, 'ㄒㄧㄥˋ'),
    ('做得到', 1, 'ㄉㄜˊ'),  # 使用者裁定（2026-10-08）：做得到的「得」讀 ㄉㄜˊ，其他動詞＋得維持輕聲
    ('沒關係', 2, '˙ㄒㄧ'),  # 使用者裁定（2026-10-08）；「哪個、每個」維持 ˙ㄍㄜ、「關卡」維持 ㄎㄚˇ
]
# 疊字親屬稱謂與「謝謝」：第二字讀輕聲（教育部重編國語辭典）
for w in ['爸爸', '媽媽', '哥哥', '弟弟', '妹妹', '爺爺', '奶奶', '謝謝', '叔叔', '伯伯', '舅舅', '姑姑', '阿姨', '寶寶']:
    if w[0] == w[1]:
        RULES.append((w, 1, '˙X'))  # 佔位，建 RULE_MAP 時以字型表的輕聲讀音補正

RULE_MAP = defaultdict(list)
for w, i, z in RULES:
    if z.startswith('˙X'):  # 疊字：找字型表裡的輕聲讀音
        neu = [r for r in PT.get(w[i], []) if r.startswith('˙')]
        if not neu:
            continue
        z = neu[0]
    RULE_MAP[w].append((i, z))
NUMERAL = set('0123456789０１２３４５６７８９一二三四五六七八九十百千萬零兩幾')

HE_WORDS = ['和平', '溫和', '暖和', '和好', '和諧', '和氣', '柔和', '平和', '緩和', '附和', '和尚', '和樂', '祥和', '和睦', '總和', '和解', '共和', '和風']

def tone(ch, z):
    """讀音的聲調 1–4；輕聲依該字的非輕聲讀音推回原調（例：˙ㄍㄜ → ㄍㄜˋ → 4）"""
    if z.startswith('˙'):
        body = z[1:]
        full = [r for r in PT.get(ch, []) if not r.startswith('˙') and r.rstrip('ˊˇˋ') == body]
        if not full:
            return 1
        z = full[0]
    return 4 if z.endswith('ˋ') else 2 if z.endswith('ˊ') else 3 if z.endswith('ˇ') else 1

def choose(run, prev=''):
    """回傳 [(字, 讀音, 讀音序號, 來源, 候選)]"""
    py = [norm(z) for z in lazy_pinyin(run, style=Style.BOPOMOFO)]
    if len(py) != len(run):
        py = [None] * len(run)
    out = [None] * len(run)
    # 先套人工規則
    for w, items in sorted(RULE_MAP.items(), key=lambda kv: len(kv[0])):  # 長詞後套，蓋過短詞
        for m in re.finditer(re.escape(w), run):
            for i, z in items:
                out[m.start() + i] = (z, 'rule')
    # 新酷音斷詞：動態規劃，讓「詞長平方和」最大（偏好長詞，避免「好高｜興」這種切法）
    n = len(run)
    best = [(0, [])] + [None] * n
    for e in range(1, n + 1):
        cands_ = [(best[e - 1][0] + 0, best[e - 1][1])]  # 單字不加分
        for L in range(2, min(MAXW, e) + 1):
            w = run[e - L:e]
            if w in TSI and best[e - L] is not None:
                cands_.append((best[e - L][0] + L * L, best[e - L][1] + [(e - L, w)]))
        best[e] = max(cands_, key=lambda t: t[0])
    cover = {}  # 字位置 -> 涵蓋它的新酷音詞給的讀音候選
    for pos, hit in best[n][1]:
        for k, ch in enumerate(hit):
            j = pos + k
            if ch in PT:
                cover[pos + k] = {zs[k] for zs in TSI[hit] if zs[k] in PT[ch]}
            if out[j] is not None or ch not in PT or len(PT[ch]) < 2:
                continue
            cands = {zs[k] for zs in TSI[hit] if zs[k] in PT[ch]}
            if len(cands) == 1:
                out[j] = (cands.pop(), f'chewing:{hit}')
            elif len(cands) > 1:
                if py[j] in cands:
                    out[j] = (py[j], f'chewing+py:{hit}')
                elif PT[ch][0] in cands:
                    out[j] = (PT[ch][0], f'chewing多讀取預設:{hit}')
                else:
                    out[j] = (sorted(cands)[0], f'chewing多讀:{hit}')
    # 使用者裁定（2026-10-08）的標音原則
    prev_ch = prev.rstrip()[-1:] if prev.strip() else ''
    for j, ch in enumerate(run):
        if out[j] and out[j][1] == 'rule':
            continue
        before = run[j - 1] if j > 0 else prev_ch
        # 數字後的「個」標輕聲；程式字串開頭的「個」前面通常是算出來的數字（' + n + ' 個、${n} 個）
        if ch == '個' and (before in NUMERAL or (j == 0 and before and before in "'\"`}")):
            out[j] = ('˙ㄍㄜ', '量詞輕聲')
        elif ch == '和' and not any(w in run[max(0, j - 1):j + 2] for w in HE_WORDS):
            out[j] = ('ㄏㄢˋ', '連接詞和')                # 和平、溫和等詞仍依詞庫
    final = [None] * n
    for j, ch in enumerate(run):
        readings = PT.get(ch)
        if readings:
            final[j] = out[j][0] if out[j] and out[j][0] in readings else readings[0]
    # 「一、不」變調：最後處理，依後一字的讀音
    for j, ch in enumerate(run):
        if ch not in '一不' or (out[j] and out[j][1] == 'rule'):
            continue
        nxt = run[j + 1] if j + 1 < n else ''
        before = run[j - 1] if j > 0 else prev_ch
        if not nxt or not final[j + 1]:
            out[j] = (PT[ch][0], '本調(句尾)'); continue
        if ch == '一':
            if before == '第' or before in NUMERAL or nxt in NUMERAL or nxt in '月號樓' or run[j + 1:j + 3] == '年級':
                out[j] = ('ㄧ', '本調(序數/數字)'); continue
            if j > 0 and run[j - 1] == nxt:            # 看一看、選一選
                out[j] = ('ㄧ', '本調(動詞一動詞)'); continue
            out[j] = ('ㄧˊ' if tone(nxt, final[j + 1]) == 4 else 'ㄧˋ', '變調')
        else:
            out[j] = ('ㄅㄨˊ' if tone(nxt, final[j + 1]) == 4 else 'ㄅㄨˋ', '變調')
    res = []
    for j, ch in enumerate(run):
        readings = PT.get(ch)
        if not readings:
            res.append((ch, '', -1, '字型無此字', '')); continue
        if len(readings) < 2:
            res.append((ch, readings[0], 0, '單音', '')); continue
        if out[j]:
            z, src = out[j]
        else:
            z, src = readings[0], '預設'
        idx = readings.index(z) if z in readings else 0
        res.append((ch, readings[idx], idx, src, '/'.join(readings)))
    return res

OVERRIDES = {}  # 前後文（含【】） -> 讀音；來自使用者確認表

def annotate_text(s, log, where, lead=''):
    def rep(m):
        run = m.group(0)
        out = []
        for k, (ch, z, idx, src, cands) in enumerate(choose(run, (lead + s[:m.start()])[-4:])):
            ctx0 = run[max(0, k - 4):k] + '【' + ch + '】' + run[k + 1:k + 5]
            if ctx0 in OVERRIDES and OVERRIDES[ctx0] in PT.get(ch, []):
                z = OVERRIDES[ctx0]; idx = PT[ch].index(z); src = '覆核修正'
            out.append(ch + (chr(0xE01E0 + idx) if idx > 0 else ''))
            if cands:  # 只記破音字
                ctx = run[max(0, k - 4):k] + '【' + ch + '】' + run[k + 1:k + 5]
                log.append(dict(位置=where, 前後文=ctx, 字=ch, 採用讀音=z, 讀音序號=idx + 1,
                                依據=src, 全部讀音=cands))
        return ''.join(out)
    return HAN.sub(rep, s)

def process(html, log):
    out = []
    pos = 0
    # 依序處理：<style> 不動；<script> 內整段處理；其餘只處理標籤外文字；<title> 不動
    tok = re.compile(r'<style[\s\S]*?</style>|<title>[\s\S]*?</title>|<!--[\s\S]*?-->|(<script[^>]*>)([\s\S]*?)(</script>)|<[^>]+>', re.I)
    tail = ''  # 跨標籤的前文（例：<span>0</span> 個）
    block = re.compile(r'</?(p|div|h\d|li|section|main|button|br|td|tr|table|ul|ol|body|label)', re.I)
    for m in tok.finditer(html):
        seg = html[pos:m.start()]
        out.append(annotate_text(seg, log, '頁面文字', tail))
        tail = (tail + seg)[-8:]
        if m.group(1) is not None:
            out.append(m.group(1) + annotate_text(m.group(2), log, '程式訊息') + m.group(3))
            tail = ''
        else:
            out.append(m.group(0))
            if block.match(m.group(0)):
                tail = ''  # 換段落就不接前文
        pos = m.end()
    out.append(annotate_text(html[pos:], log, '頁面文字', tail))
    return ''.join(out)
