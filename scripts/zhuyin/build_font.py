"""重做縮減版注音字型：只保留 II 學習單用到的字（含 IVS 破音選擇）。

學習單新增了字型裡沒有的字時才需要跑（apply_zhuyin.py 會提醒）。
字型：源泉注音圓體 BpmfGenSenRounded v1.500（ButTaiwan/bpmfvs，SIL OFL 1.1），原檔自動下載到 .cache/。
用法（repo 根目錄）：python scripts/zhuyin/build_font.py
"""
import glob, os, re, urllib.request, zipfile
from fontTools import subset
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CACHE = os.path.join(HERE, '.cache')
OUT = os.path.join(ROOT, 'web', 'public', 'zhuyin')
ZIP_URL = 'https://github.com/ButTaiwan/bpmfvs/releases/download/v1.500/BpmfGenSenRounded.zip'
IVS = re.compile('[\U000E0100-\U000E01EF]')


def source_font(weight):
    path = os.path.join(CACHE, f'BpmfGenSenRounded-{weight}.ttf')
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        zpath = os.path.join(CACHE, 'BpmfGenSenRounded.zip')
        if not os.path.exists(zpath):
            print('下載字型原檔（約 26MB）…')
            urllib.request.urlretrieve(ZIP_URL, zpath + '.part')
            os.replace(zpath + '.part', zpath)
        with zipfile.ZipFile(zpath) as z:
            z.extract(os.path.basename(path), CACHE)
    return path


chars = {chr(c) for c in range(0x20, 0x7f)}
for f in glob.glob(os.path.join(ROOT, 'packages', 'level-ii', '*', 'worksheet.html')):
    t = IVS.sub('', open(f, encoding='utf-8').read())
    t = re.sub(r'<style[\s\S]*?</style>', '', t)
    chars |= set(re.findall(r'[^\x00-\x7f]', t))
unis = {ord(c) for c in chars} | set(range(0xE0100, 0xE01F0))      # IVS 選擇子
unis |= set(range(0x3105, 0x3130)) | {0x02C7, 0x02CA, 0x02CB, 0x02D9}  # 注音與聲調

for w in ['R', 'B']:
    opts = subset.Options()
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.flavor = 'woff2'
    font = TTFont(source_font(w))
    s = subset.Subsetter(opts)
    s.populate(unicodes=unis)
    s.subset(font)
    out = os.path.join(OUT, f'cce-zhuyin-{w}.woff2')
    font.flavor = 'woff2'
    font.save(out)
    print(w, os.path.getsize(out) // 1024, 'KB')
