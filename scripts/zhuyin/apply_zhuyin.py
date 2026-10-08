"""II（5–8 歲）學習單加注音：標破音字讀音＋掛上注音／朗讀開關。

用法（在 repo 根目錄）：
  pip install -r scripts/zhuyin/requirements.txt
  python scripts/zhuyin/apply_zhuyin.py            # 重新標音所有 packages/level-ii/*/worksheet.html
  python scripts/zhuyin/apply_zhuyin.py 1.1-II     # 只處理指定教案
  python scripts/zhuyin/apply_zhuyin.py --check    # 只檢查、不寫檔（有需要更新的會列出並以代碼 1 結束）
  python scripts/zhuyin/apply_zhuyin.py --report DIR   # 另外輸出每份的破音字標音紀錄 CSV

冪等：先移除舊的讀音記號與開關程式，再重新標音，所以改過文字後直接重跑即可。
保證：移除讀音記號與開關那一行後，結果必須和標音前一字不差（只加不改）。
"""
import csv, glob, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import zhuyin_core as zc

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MARK = '<!-- cce-zhuyin -->\n<script src="/zhuyin/cce-zhuyin.js" defer></script>\n'
IVS = re.compile('[\U000E0100-\U000E01EF]')
FONT = os.path.join(ROOT, 'web', 'public', 'zhuyin', 'cce-zhuyin-R.woff2')


def strip(html):
    return IVS.sub('', html.replace(MARK, ''))


def load_overrides():
    path = os.path.join(os.path.dirname(__file__), 'overrides.csv')
    for r in csv.DictReader(open(path, encoding='utf-8')):
        zc.OVERRIDES[r['前後文']] = r['讀音']


def font_chars():
    try:
        from fontTools.ttLib import TTFont
    except ImportError:
        return None
    return {chr(c) for c in TTFont(FONT).getBestCmap()}


def main(argv):
    check = '--check' in argv
    report = argv[argv.index('--report') + 1] if '--report' in argv else None
    keys = [a for a in argv if re.fullmatch(r'\d+\.\d+-II', a)]
    files = sorted(glob.glob(os.path.join(ROOT, 'packages', 'level-ii', '*', 'worksheet.html')))
    if keys:
        files = [f for f in files if os.path.basename(os.path.dirname(f)) in keys]
    load_overrides()
    covered = font_chars()
    stale, missing = [], set()
    for f in files:
        key = os.path.basename(os.path.dirname(f))
        html = open(f, encoding='utf-8', newline='').read()
        base = strip(html)
        log = []
        out = zc.process(base, log)
        if '</head>' not in out:
            sys.exit(f'{key}: 找不到 </head>')
        out = out.replace('</head>', MARK + '</head>', 1)
        if strip(out) != base:
            sys.exit(f'{key}: 標音後內容有變動（不應發生），已停止')
        if covered is not None:
            text = re.sub(r'<style[\s\S]*?</style>', '', base)
            missing |= {c for c in re.findall(r'[^\x00-\x7f]', text) if c not in covered}
        if report:
            os.makedirs(report, exist_ok=True)
            with open(os.path.join(report, f'{key}.csv'), 'w', encoding='utf-8-sig', newline='') as fh:
                w = csv.DictWriter(fh, fieldnames=['位置', '前後文', '字', '採用讀音', '讀音序號', '依據', '全部讀音'])
                w.writeheader(); w.writerows(log)
        if out != html:
            stale.append(key)
            if not check:
                open(f, 'w', encoding='utf-8', newline='').write(out)
        print(f'{key}: 破音字 {len(log)} 處，非預設讀音 {sum(r["讀音序號"] > 1 for r in log)} 處'
              + ('（需更新）' if out != html and check else '（已更新）' if out != html else ''))
    if missing:
        print(f'警告：有 {len(missing)} 個字不在注音字型內（{"".join(sorted(missing))[:40]}），'
              '請執行 python scripts/zhuyin/build_font.py 重做字型', file=sys.stderr)
    if check and stale:
        sys.exit(f'{len(stale)} 份需要重新標音：{" ".join(stale)}')


if __name__ == '__main__':
    main(sys.argv[1:])
