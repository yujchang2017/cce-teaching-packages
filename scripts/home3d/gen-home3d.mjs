// 產生「氣候教案群島」3D 彩蛋頁（首頁標題連點 3 下進入）：把教案清單、試教統計、點閱數注入 template.html；左上角可一鍵切換「六大主題／縣市試教」（?mode=county）
// 建置時由 GitHub Actions 執行（見 .github/workflows/build-and-deploy.yml），輸出不進版控。
// 用法（在 web/ 下）：node ../scripts/home3d/gen-home3d.mjs --packages data/packages.json --stats data/stats.json --views data/view-stats.json --out public/home3d/index.html
// 重算教學銜接線（只在本機，原始分析資料不進 repo）：再加 --rec <unesco_rec.json>，會更新同資料夾的 flows.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = name => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; };
const readJson = (p, fallback = null) => { try { return p && fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback; } catch { return fallback; } };
const PKG = arg('packages') || 'data/packages.json', OUT = arg('out') || 'public/home3d/index.html';
const TPL = path.join(HERE, 'template.html'), FLOWS = path.join(HERE, 'flows.json');
const pk = JSON.parse(fs.readFileSync(PKG, 'utf8'));
const all = (Array.isArray(pk) ? pk : pk.packages).filter(p => p.level !== 'V');
// 試教統計（fetch-stats.mjs 產生，姓名已遮成「姓氏＋老師」、學校只到「縣市・學制」）
const ST = readJson(arg('stats'));
const VS = readJson(arg('views'), {});
const pkgByKey = Object.fromEntries(all.map(p => [p.keyId, p]));
// 2026-11-21 使用者裁定 (b)：整個彩蛋都不顯示老師姓氏
const teachers = (ST?.byTeacher || []).map(t => ({ name: '試教老師', school: t.school, submissions: t.submissions, students: t.students, badge: t.badge, themes: t.themes,
  packages: (t.packages || []).filter(p => pkgByKey[p.keyId]).map(p => ({ ...p, topic: pkgByKey[p.keyId].topic.replace(/^\d\.\d-[IVX]+\s*/, '') })) })).filter(t => t.packages.length);


// 各教案累計開啟次數快照（2026-10-23 事件表彙總：教案頁瀏覽＋簡報點閱＋學習單點閱，自 2026-05-12 起，含測試事件）
const OPENS = {"1.1-II":450,"1.1-III":617,"1.1-IV":171,"1.2-II":86,"1.2-III":200,"1.2-IV":60,"1.3-II":64,"1.3-III":71,"1.3-IV":43,"1.4-II":48,"1.4-III":98,"1.4-IV":56,"1.5-II":51,"1.5-III":190,"1.5-IV":13,"1.6-II":52,"1.6-III":48,"1.6-IV":19,"2.1-II":173,"2.1-III":255,"2.1-IV":116,"2.2-II":34,"2.2-III":21,"2.2-IV":8,"2.3-II":19,"2.3-III":52,"2.3-IV":1,"2.4-II":10,"2.4-III":31,"2.4-IV":23,"2.5-II":3,"2.5-III":80,"2.5-IV":27,"2.6-II":18,"2.6-III":48,"2.6-IV":16,"3.1-II":149,"3.1-III":165,"3.1-IV":56,"3.2-II":15,"3.2-III":53,"3.2-IV":16,"3.3-II":14,"3.3-III":45,"3.3-IV":16,"3.4-II":13,"3.4-III":33,"3.4-IV":47,"4.1-II":86,"4.1-III":103,"4.1-IV":63,"4.2-II":21,"4.2-III":50,"4.2-IV":14,"4.3-II":2,"4.3-III":14,"4.3-IV":8,"4.4-II":7,"4.4-III":23,"4.4-IV":14,"4.5-II":26,"4.5-III":12,"4.5-IV":3,"4.6-II":3,"4.6-III":30,"4.6-IV":2,"5.1-II":67,"5.1-III":97,"5.1-IV":46,"5.2-II":14,"5.2-III":95,"5.2-IV":29,"5.3-II":9,"5.3-III":40,"5.3-IV":15,"5.4-II":51,"5.4-III":15,"5.4-IV":11,"5.5-II":2,"5.5-III":69,"6.1-II":113,"6.1-III":118,"6.1-IV":64,"6.2-II":61,"6.2-III":49,"6.2-IV":5,"6.3-II":35,"6.3-III":255,"6.3-IV":10,"6.4-II":11,"6.4-III":42,"6.4-IV":6,"6.5-II":1,"6.5-III":40,"6.5-IV":19,"6.6-II":30,"6.6-III":138,"6.6-IV":17,"6.7-II":16,"6.7-III":32,"6.7-IV":20};

// 子主題：短名、白話說明、模型
const SUB = {
  '1.1': ['天氣與氣候', '分清楚今天的天氣和長期的氣候，認識氣候正在改變。', 'weather'],
  '1.2': ['溫室效應', '溫室氣體像地球的大棉被，蓋得太厚地球就發燒。', 'greenhouse'],
  '1.3': ['碳循環', '碳在空氣、植物、海洋和地底之間旅行，人類打亂了它的平衡。', 'forest'],
  '1.4': ['水循環', '蒸發、降雨、流回大海；暖化讓乾旱和水災更極端。', 'river'],
  '1.5': ['污染與節約資源', '少製造污染、節約資源，從生活小事做起。', 'factory'],
  '1.6': ['再生能源', '陽光、風、水的能源，和會排碳的化石燃料比一比。', 'windmill'],
  '2.1': ['自然環境', '森林、海洋、濕地，各種生態系怎麼運作。', 'globe'],
  '2.2': ['生物多樣性演化', '物種從古到今怎麼變化，未來又會怎樣。', 'clock'],
  '2.3': ['生態系服務', '大自然免費提供乾淨的空氣、水和食物。', 'pavilion'],
  '2.4': ['農業與糧食', '人類馴化動植物，糧食生產和氣候互相影響。', 'farm'],
  '2.5': ['生物多樣性流失', '人類活動讓物種消失，會帶來什麼後果。', 'magnifier'],
  '2.6': ['與自然重新連結', '走進自然、向原住民智慧學習、一起守護物種。', 'forest'],
  '3.1': ['氣候不平等', '排碳最少的人，往往受害最深。', 'scale'],
  '3.2': ['社會決定因素', '貧富、性別、身分，如何影響誰更脆弱。', 'house'],
  '3.3': ['歷史與政治', '從殖民和工業化，看今天的氣候不正義從何而來。', 'clock'],
  '3.4': ['轉型的未來', '公平、綠色、人人有份的轉型。', 'stage'],
  '4.1': ['社會影響', '氣候變遷對健康、生計和社區的衝擊。', 'clinic'],
  '4.2': ['安全與韌性', '颱風、熱浪來了，怎麼準備、怎麼復原。', 'hall'],
  '4.3': ['氣候焦慮', '擔心地球是正常的，學會把擔心變成行動。', 'heart'],
  '4.4': ['互相連結的力量', '人、自然和城市系統互相依存，連結就是力量。', 'river'],
  '4.5': ['社群行動', '時間緊迫，學校和社區可以一起做什麼。', 'stage'],
  '4.6': ['錯假訊息', '當個真相偵探，辨別氣候謠言。', 'magnifier'],
  '5.1': ['經濟與發展', '資源有限，經濟成長也要算進環境的代價。', 'coin'],
  '5.2': ['循環經濟', '用完不丟，讓物品和材料一直循環。', 'recycle'],
  '5.3': ['氣候與經濟', '極端天氣讓生活和產業付出多少代價。', 'market'],
  '5.4': ['能源與碳排', '我們用的電從哪裡來、排了多少碳。', 'factory'],
  '5.5': ['後碳經濟中的我', '負責任地消費，讓物品用得更久。', 'kiosk'],
  '6.1': ['親近自然', '用五感接近自然，培養愛護自然的心。', 'forest'],
  '6.2': ['再生能源的使用', '在家、在學校怎麼用綠電、省能源。', 'windmill'],
  '6.3': ['負責任的消費', '分清需要和想要，買得少、買得好。', 'market'],
  '6.4': ['永續生活空間', '綠色校園和城市，讓住的地方更涼、更好。', 'house'],
  '6.5': ['永續交通', '走路、騎車、搭大眾運輸，移動也能低碳。', 'bus'],
  '6.6': ['永續飲食', '吃在地、當季、少浪費，健康又減碳。', 'farm'],
  '6.7': ['廢棄物處理', '垃圾減量、分類回收、再利用。', 'recycle'],
};
const LV = {
  II: ['國小低年級', '5–8 歲', 'Ages 5–8'],
  III: ['國小中高年級', '9–12 歲', 'Ages 9–12'],
  IV: ['國中', '13–15 歲', 'Ages 13–15'],
};
const fmt = n => n.toLocaleString('en-US');

function subItem(code) {
  const [name, desc, model] = SUB[code];
  const pkgs = ['II', 'III', 'IV'].map(lv => all.find(p => p.keyId === `${code}-${lv}`)).filter(Boolean);
  const opens = pkgs.map(p => OPENS[p.keyId] || 0);
  const total = opens.reduce((a, b) => a + b, 0);
  const top = pkgs[opens.indexOf(Math.max(...opens))];
  return {
    id: code, name, nameEn: pkgs[1]?.topicEn || pkgs[0]?.topicEn || '', desc, model,
    facts: [
      `${pkgs.length} 個年段版本（${pkgs.map(p => LV[p.level][0]).join('、')}）`,
      `累計開啟 ${fmt(total)} 次（教案頁＋簡報＋學習單）`,
      `最常被開啟：${LV[top.level][0]}版 ${fmt(Math.max(...opens))} 次`,
    ],
    timeline: pkgs.map((p, i) => ({ lv: p.level, label: LV[p.level][0], age: LV[p.level][1], ageEn: LV[p.level][2], topic: p.topic.replace(/^\d\.\d-[IVX]+\s*/, ''), href: `/package/${p.keyId}/`, opens: opens[i] })),
  };
}

const THEMES = [
  { id: 't1', n: 1, q: 0, r: -1, name: '氣候科學', nameEn: 'Climate science', color: '#58a6a6', style: 'brick', icon: '🌡️', tree: 'conifer', summary: '天氣、溫室效應、碳與水的循環、再生能源：先弄懂地球怎麼了。' },
  { id: 't2', n: 2, q: 1, r: -1, name: '生態系與生物多樣性', nameEn: 'Ecosystems & biodiversity', color: '#7fae6a', style: 'speckle', icon: '🌿', tree: 'broadleaf', summary: '森林、海洋、糧食與物種：人類和自然是一家人。' },
  { id: 't3', n: 3, q: -1, r: 0, name: '氣候正義', nameEn: 'Climate justice', color: '#db6a41', style: 'stripe', icon: '⚖️', tree: 'cherry', summary: '誰排碳、誰受害？公平地面對氣候變遷。' },
  { id: 't4', n: 4, q: 0, r: 0, name: '韌性建構', nameEn: 'Building resilience', color: '#6f7fb5', style: 'brick', icon: '🛡️', tree: 'willow', summary: '面對颱風、熱浪和焦慮，個人和社區一起變得更強韌。' },
  { id: 't5', n: 5, q: 1, r: 0, name: '後碳經濟', nameEn: 'Post-carbon economy', color: '#e0b443', style: 'speckle', icon: '♻️', tree: 'fruit', summary: '能源、循環經濟與消費：讓經濟不再靠排碳。' },
  { id: 't6', n: 6, q: 0, r: 1, name: '永續生活型態', nameEn: 'Sustainable lifestyles', color: '#e79bb2', style: 'stripe', icon: '🏡', tree: 'palm', summary: '吃、穿、住、行、用：每天都能選擇更永續的生活。' },
];
const islands = THEMES.map(t => ({
  id: t.id, num: String(t.n).padStart(2, '0'), q: t.q, r: t.r, name: t.name, nameEn: t.nameEn, color: t.color, style: t.style,
  icon: t.icon, tree: t.tree, summary: t.summary, landmark: 'hall',
  items: Object.keys(SUB).filter(k => k.startsWith(`${t.n}.`)).map(subItem),
}));

islands.push({
  id: 'games', num: '07', q: 2, r: 0, name: '遊戲實驗室', nameEn: 'Game lab', color: '#e8884f', style: 'stripe', icon: '🎮', tree: 'conifer',
  summary: '搭配教案的互動遊戲，10 分鐘就能在課堂上玩一輪。', landmark: 'stage',
  items: [
    { id: 'g-carbon', name: '校園碳排偵探', nameEn: 'Campus carbon detective', desc: '3D 配對任務：找出校園裡的碳排來源。', model: 'magnifier', facts: ['建議時間 10–15 分鐘', '搭配教案 1.2-III 溫室效應'], href: '/games/' },
    { id: 'g-animals', name: '幫動物，接回一條路', nameEn: 'Reconnect the path', desc: '動物通道實驗室：替被道路切斷的棲地搭橋。', model: 'river', facts: ['建議時間 15–20 分鐘', '搭配教案 2.5-III'], href: '/games/' },
    { id: 'g-heat', name: '涼爽的路', nameEn: 'The cool road', desc: '都市降溫實驗室：種樹、遮陰，讓上學路變涼。', model: 'forest', facts: ['建議時間 2–5 分鐘', '搭配教案 3.2-III'], href: '/games/' },
    { id: 'g-water', name: '一場雨，兩條路', nameEn: 'One rain, two paths', desc: '流域實驗室：雨水往哪裡流，城市會不會淹水。', model: 'weather', facts: ['建議時間 2–5 分鐘', '搭配教案 4.2-III'], href: '/games/' },
    { id: 'g-recycling', name: '產品回家之後', nameEn: 'After products come home', desc: '為回收而設計：拆解產品、分類材料。', model: 'recycle', facts: ['建議時間 15–20 分鐘', '搭配教案 5.2-III'], href: '/games/' },
    { id: 'g-pizza', name: '一人一半，怎麼切？', nameEn: 'Fair pizza', desc: '3D 披薩分配實驗室：怎麼分才公平。', model: 'pizza', facts: ['建議時間 10–15 分鐘', '搭配教案 6.6-III'], href: '/games/' },
  ],
});
islands.push({
  id: 'community', num: '08', q: -2, r: 1, name: '教師社群', nameEn: 'Teacher community', color: '#b48560', style: 'brick', icon: '🤝', tree: 'fruit',
  summary: '老師試教、回饋、改編，一起讓教案越來越好。', landmark: 'pavilion',
  items: [
    { id: 'c-feedback', name: '試教回饋', nameEn: 'Trial feedback', desc: '老師上傳試教紀錄與學生作品，回饋給教案作者。', model: 'stage', facts: [ST?.schools && `${ST.schools} 所學校參與試教`, ST?.totalStudents && `${fmt(ST.totalStudents)} 試教學生人次`].filter(Boolean), href: '/#community-stats' },
    { id: 'c-news', name: '最新消息', nameEn: 'News', desc: '網站維護進度與教案更新說明。', model: 'kiosk', facts: ['每次教案更新都會公告'], href: '/' },
    { id: 'c-remix', name: '改編共創', nameEn: 'Remix', desc: '在任何一份教案頁按「改編」，做出適合自己班級的版本。', model: 'classroom', facts: ['教案採 CC BY-SA 4.0 授權'], href: '/' },
    { id: 'c-list', name: '列表版首頁', nameEn: 'Classic list', desc: '用搜尋和篩選快速找到教案。', model: 'book', facts: [`${all.length} 個教學組合包`, '4 種篩選：年段、主題、遊戲、排序'], href: '/' },
  ],
});
islands.push({
  id: 'guide', num: '09', q: -1, r: -1, name: 'UNESCO 指南', nameEn: 'UNESCO guidance', color: '#3e7c8c', style: 'speckle', icon: '📘', tree: 'broadleaf',
  summary: '所有教案都依據 UNESCO《綠色課程指南》開發。', landmark: 'book',
  items: [
    { id: 'u-guide', name: '綠色課程指南', nameEn: 'Greening curriculum guidance', desc: 'UNESCO《綠色課程指南：氣候行動的教學與學習》中文版。', model: 'book', facts: ['6 大關鍵概念', '4 個年段'], href: 'https://cce.tw/' },
    { id: 'u-concepts', name: '六大關鍵概念', nameEn: 'Six key concepts', desc: '氣候科學、生態系、氣候正義、韌性、後碳經濟、永續生活。', model: 'globe', facts: ['6 大主題', '34 個子主題'], href: 'https://cce.tw/' },
    { id: 'u-ages', name: '年段設計', nameEn: 'Age bands', desc: '同一個子主題，依年齡設計不同深度的版本。', model: 'clock', facts: ['3 個年段已上線：5–8、9–12、13–15 歲'], href: 'https://cce.tw/' },
  ],
});

// ---- 教學銜接線：依《國中小 UNESCO 節點推薦》（2026-10-09，CCMAP 分析）的強連結配對 ----
// 同一條課綱學習內容同時強連結到兩個不同主題的子主題 → 算一筆共同證據；每對主題取證據最多的一組子主題
function computeFlows(REC) {
const STAGE = { I: '國小低年級', II: '國小中年級', III: '國小高年級', IV: '國中' };
const byStmt = new Map();
for (const [stage, kid, dom, , code, content, , sim] of REC.strong) {
  const key = stage + '|' + code;
  if (!byStmt.has(key)) byStmt.set(key, { stage, dom, code, content, subs: new Map() });
  const sub = kid.split('-')[0], e = byStmt.get(key);
  if (!e.subs.has(sub) || e.subs.get(sub) < sim) e.subs.set(sub, sim);
}
const pairs = new Map();
for (const e of byStmt.values()) {
  const subs = [...e.subs.keys()].sort();
  for (let i = 0; i < subs.length; i++) for (let j = i + 1; j < subs.length; j++) {
    const a = subs[i], b = subs[j]; if (a[0] === b[0]) continue;
    const k = a + '~' + b; if (!pairs.has(k)) pairs.set(k, { a, b, ex: [], stages: new Set(), doms: new Set() });
    const p = pairs.get(k); p.stages.add(e.stage); p.doms.add(e.dom);
    p.ex.push({ stage: STAGE[e.stage], dom: e.dom, code: e.code, content: e.content, sim: +((e.subs.get(a) + e.subs.get(b)) / 2).toFixed(3) });
  }
}
const bestPerThemes = new Map();
for (const p of pairs.values()) {
  const tk = p.a[0] + '-' + p.b[0], cur = bestPerThemes.get(tk);
  const mean = p.ex.reduce((s, x) => s + x.sim, 0) / p.ex.length;
  if (!cur || p.ex.length > cur.ex.length || (p.ex.length === cur.ex.length && mean > cur.mean)) bestPerThemes.set(tk, { ...p, mean });
}
const levelOf = n => (n >= 15 ? 'strong' : n >= 8 ? 'suggest' : 'pending');
// 取證據最多的 10 組，但每種線型至少留 2 條示意
const ranked = [...bestPerThemes.values()].sort((x, y) => y.ex.length - x.ex.length || y.mean - x.mean);
const chosen = ranked.filter(p => levelOf(p.ex.length) !== 'pending').slice(0, 8);
chosen.push(...ranked.filter(p => levelOf(p.ex.length) === 'pending').slice(0, 2));
// 小人搬運的學習內容：相似度高者優先，但先讓不同領域各出現一次，徽章才看得出領域差異
function pickCarried(ex, max = 6) {
  const out = [], seen = new Set();
  for (const x of ex) if (!seen.has(x.dom)) { seen.add(x.dom); out.push(x); }
  for (const x of ex) if (out.length < max && !out.includes(x)) out.push(x);
  return out.slice(0, max).map(({ stage, dom, code }) => ({ stage, dom, code }));
}
const ROLE_CYCLE = ['researcher', 'farmer', 'teacher', 'worker', 'student', 'elder', 'parent', 'commuter', 'traveler'];
const flows = chosen.map((p, i) => {
  const ex = p.ex.sort((x, y) => y.sim - x.sim);
  const nameA = SUB[p.a][0], nameB = SUB[p.b][0];
  return {
    id: 'f' + (i + 1), from: 't' + p.a[0], to: 't' + p.b[0], fromItem: p.a, toItem: p.b,
    carried: pickCarried(ex), carryName: `${ex[0].code} ${ex[0].dom}`, role: ROLE_CYCLE[i % ROLE_CYCLE.length],
    level: levelOf(ex.length), n: ex.length, mean: +p.mean.toFixed(3),
    stages: ['I', 'II', 'III', 'IV'].filter(s => p.stages.has(s)).map(s => STAGE[s]), doms: [...p.doms],
    desc: `${ex.length} 條課綱學習內容同時強連結「${p.a} ${nameA}」與「${p.b} ${nameB}」。`,
    examples: ex.slice(0, 3).map(({ stage, dom, code, content, sim }) => ({ stage, dom, code, content, sim })),
  };
});
  return flows;
}
const REC = readJson(arg('rec'));
if (REC) fs.writeFileSync(FLOWS, JSON.stringify(computeFlows(REC), null, 1) + '\n', 'utf8');
const flows = readJson(FLOWS, []);

const dayCycle = [
  { at: 360, label: '清晨・看天氣', labelEn: 'Dawn · weather check', items: ['1.1', '1.4'] },
  { at: 450, label: '上學路上', labelEn: 'On the way to school', items: ['6.5', '4.2'] },
  { at: 540, label: '自然課', labelEn: 'Science class', items: ['1.2', '1.3', '2.3', '1.6'] },
  { at: 720, label: '午餐時間', labelEn: 'Lunch', items: ['6.6', '2.4', '5.2'] },
  { at: 840, label: '社會課', labelEn: 'Social studies', items: ['3.1', '3.2', '4.1', '5.3'] },
  { at: 990, label: '放學後', labelEn: 'After school', items: ['6.1', '2.6', '6.3', '4.5'] },
  { at: 1140, label: '晚上在家', labelEn: 'Evening at home', items: ['5.4', '6.2', '6.7', '4.3'] },
  { at: 1320, label: '睡前滑手機', labelEn: 'Before bed', items: ['4.6', '2.2'] },
];

const DATA = {
  title: '氣候教案群島', titleEn: 'Climate Lesson Isles',
  stats: { packages: all.length, schools: ST?.schools ?? 0, teachers: ST?.teachers ?? 0, students: ST?.totalStudents ?? 0, sessions: ST?.trialSessions ?? 0, pptViews: VS.pptViews ?? 0, worksheetViews: VS.worksheetViews ?? 0, asOf: (ST?.generatedAt || '').slice(0, 10) },
  islands, flows, dayCycle, teachers,
};
// ===== 縣市模式（2026-11-21）：每個縣市一座島，位置依台灣大致方位排；沒有試教的縣市是小沙洲 =====
// 資料：stats.json 的 countyIsles（fetch-stats.mjs 依校名、別名表與「任教縣市」判定各校縣市；只有校名，沒有老師姓名）
const CD = (() => {
  const by = new Map();
  for (const s of ST?.countyIsles?.schools || []) {
    if (!by.has(s.city)) by.set(s.city, { city: s.city, schools: [], submissions: 0, students: 0 });
    const c = by.get(s.city); c.schools.push(s); c.submissions += s.submissions; c.students += s.students;
  }
  return { generatedAt: ST?.generatedAt || '', totals: { submissions: ST?.totalSubmissions || 0 }, cities: [...by.values()] };
})();
// 縣市大致中心經緯度（外島已往本島內縮：金門、馬祖、澎湖的位置不是實際比例）
const GEO = {
  '台北市': [121.56, 25.08], '新北市': [121.62, 24.93], '基隆市': [121.74, 25.13], '桃園市': [121.24, 24.93],
  '新竹市': [120.97, 24.80], '新竹縣': [121.17, 24.70], '宜蘭縣': [121.68, 24.62], '苗栗縣': [120.90, 24.50],
  '台中市': [120.85, 24.22], '彰化縣': [120.47, 23.98], '南投縣': [120.98, 23.87], '花蓮縣': [121.45, 23.82],
  '雲林縣': [120.40, 23.70], '嘉義市': [120.45, 23.47], '嘉義縣': [120.55, 23.40], '台南市': [120.30, 23.12],
  '高雄市': [120.50, 22.85], '台東縣': [121.08, 22.90], '屏東縣': [120.62, 22.48],
  '澎湖縣': [119.70, 23.57], '金門縣': [119.15, 24.45], '連江縣': [120.05, 25.85],
};
const STG = n => (n === 0 ? 0 : n < 5 ? 1 : n < 20 ? 2 : 3);
const C_COL = ['#e1d1ab', '#9cc27a', '#58a6a6', '#db6a41'];
const C_ICON = ['🚩', '🌱', '🏡', '🏘️'];
const C_TREE = ['palm', 'broadleaf', 'conifer', 'cherry'];
const C_LM = [null, 'kiosk', 'classroom', 'hall'];
const MODEL_OF = lv => ({ 國小: 'classroom', 國中小: 'classroom', 國中: 'court', 中學: 'court', 高中: 'court', 高中職: 'court', 機構: 'factory' }[lv] || 'pavilion');
const topicOf = k => (pkgByKey[k] ? pkgByKey[k].topic.replace(/^\d\.\d-[IVX]+\s*/, '') : '');
const THEME_NAME = Object.fromEntries(THEMES.map(t => [t.n, t.name]));
const cByName = Object.fromEntries(CD.cities.map(c => [c.city, c]));
const missing = CD.cities.filter(c => !GEO[c.city]).map(c => c.city);
if (missing.length) throw new Error('縣市沒有島的位置：' + missing.join('、'));
let sid = 0;
const cIslands = Object.entries(GEO).map(([name, [lon, lat]], i) => {
  const c = cByName[name], n = c?.submissions || 0, st = STG(n);
  const items = (c?.schools || []).map(s => ({
    id: 's' + (++sid), name: s.name, nameEn: '', model: MODEL_OF(s.level),
    desc: `${s.level}・試教 ${s.submissions} 筆・${fmt(s.students)} 學生人次${s.note ? '（' + s.note + '）' : ''}`,
    facts: [`${s.submissions} 筆試教`, `${fmt(s.students)} 學生人次`, `${s.packages.length} 份教案`],
    level: s.level, submissions: s.submissions, students: s.students,
    lessons: s.packages.map(p => ({ keyId: p.keyId, topic: topicOf(p.keyId), students: p.students, theme: +p.keyId[0] })),
  }));
  return {
    id: 'c' + i, num: n ? String(n) : '–', q: 0, r: 0, lon, lat, name, nameEn: '', color: C_COL[st], style: ['brick', 'speckle', 'stripe'][i % 3],
    icon: C_ICON[st], tree: C_TREE[st], landmark: C_LM[st], sand: st === 0, stage: st,
    summary: n ? `${items.length} 所學校・試教 ${n} 筆・${fmt(c.students)} 學生人次` : '還沒有試教紀錄，等待第一場試教 🚩',
    items,
  };
});
// ---- 島的大小：學校數、學生人次、教案數（不重複）各自除以全國最大值，加權平均（學校 50%、學生 25%、教案 25%，2026-11-21 使用者裁定）→ 規模分數 0–1 ----
// 半徑倍率 = 0.62 + 1.38 × 分數^0.8（差距拉大，使用者裁定）；沙洲固定 0.5
{
  const m = isl => ({ schools: isl.items.length, students: isl.items.reduce((a, it) => a + it.students, 0), lessons: new Set(isl.items.flatMap(it => it.lessons.map(l => l.keyId))).size });
  cIslands.forEach(isl => { isl.metric = m(isl); });
  const act = cIslands.filter(i => !i.sand);
  const mx = k => Math.max(...act.map(i => i.metric[k]));
  const MX = { schools: mx('schools'), students: mx('students'), lessons: mx('lessons') };
  cIslands.forEach(isl => {
    isl.score = isl.sand ? 0 : 0.5 * isl.metric.schools / MX.schools + 0.25 * isl.metric.students / MX.students + 0.25 * isl.metric.lessons / MX.lessons;
    isl.sc = isl.sand ? 0.5 : +(0.62 + 1.38 * Math.pow(isl.score, 0.8)).toFixed(3);
    if (!isl.sand) isl.summary += `・${isl.metric.lessons} 份教案`;
  });
}
// ---- 位置：縣市大致中心的經緯度 → 平面座標；外島往本島內縮；再把重疊的島推開（同時拉回原位） ----
const OUTER = new Set(['澎湖縣', '金門縣', '連江縣']);
{
  const LAT0 = 23.7, LON0 = 120.9, K = 12, COS = Math.cos(LAT0 * Math.PI / 180), BASE_R = 2.02, GAP = 0.9;
  cIslands.forEach(isl => { isl.ax = (isl.lon - LON0) * COS * K; isl.az = -(isl.lat - LAT0) * K; isl.x = isl.ax; isl.z = isl.az; isl.rad = BASE_R * isl.sc; });
  for (let it = 0; it < 600; it++) {
    for (let i = 0; i < cIslands.length; i++) for (let j = i + 1; j < cIslands.length; j++) {
      const a = cIslands[i], b = cIslands[j]; let dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 1e-3;
      const need = a.rad + b.rad + GAP; if (d >= need) continue;
      const push = (need - d) / 2; dx /= d; dz /= d;
      a.x -= dx * push; a.z -= dz * push; b.x += dx * push; b.z += dz * push;
    }
    cIslands.forEach(isl => { isl.x += (isl.ax - isl.x) * 0.04; isl.z += (isl.az - isl.z) * 0.04; });
  }
  cIslands.forEach(isl => { isl.x = +isl.x.toFixed(2); isl.z = +isl.z.toFixed(2); });
  let worst = Infinity;
  for (let i = 0; i < cIslands.length; i++) for (let j = i + 1; j < cIslands.length; j++) { const a = cIslands[i], b = cIslands[j]; worst = Math.min(worst, Math.hypot(b.x - a.x, b.z - a.z) - a.rad - b.rad); }
  console.log(`  島與島最小間隙 ${worst.toFixed(2)}（<0 代表重疊）`);
}
// ---- 橋：本島各縣市用最小生成樹連通（讓小人走得到），再加上很近的鄰居；外島不架橋 ----
const cBridges = [];
{
  const main = cIslands.filter(i => !OUTER.has(i.name));
  const gap = (a, b) => Math.hypot(b.x - a.x, b.z - a.z) - a.rad - b.rad;
  const E = [];
  for (let i = 0; i < main.length; i++) for (let j = i + 1; j < main.length; j++) E.push([gap(main[i], main[j]), main[i], main[j]]);
  E.sort((x, y) => x[0] - y[0]);
  const par = new Map(main.map(i => [i.id, i.id])); const find = x => (par.get(x) === x ? x : (par.set(x, find(par.get(x))), par.get(x)));
  for (const [g, a, b] of E) {
    const ra = find(a.id), rb = find(b.id);
    if (ra !== rb) { par.set(ra, rb); cBridges.push([a.id, b.id]); }
    else if (g < 1.3) cBridges.push([a.id, b.id]);
  }
  console.log(`  橋 ${cBridges.length} 座`);
}

// 跨縣市觀摩線：兩縣市試教過相同教案 → 小人搬著教案編號來回走
const C_ROLES = ['teacher', 'student', 'researcher', 'parent', 'traveler', 'commuter', 'elder', 'farmer', 'worker'];
const keysOf = isl => new Set(isl.items.flatMap(it => it.lessons.map(l => l.keyId)));
const cAct = cIslands.filter(i => !i.sand);
const cPairs = [];
for (let i = 0; i < cAct.length; i++) for (let j = i + 1; j < cAct.length; j++) {
  const A = cAct[i], B = cAct[j], kb = keysOf(B);
  const shared = [...keysOf(A)].filter(k => kb.has(k)).sort();
  if (shared.length) cPairs.push({ A, B, shared });
}
cPairs.sort((x, y) => y.shared.length - x.shared.length);
const firstSchool = (isl, k) => isl.items.find(it => it.lessons.some(l => l.keyId === k))?.id;
const cFlows = cPairs.slice(0, 10).map((p, i) => {
  const n = p.shared.length;
  return {
    id: 'f' + (i + 1), from: p.A.id, to: p.B.id, fromItem: firstSchool(p.A, p.shared[0]), toItem: firstSchool(p.B, p.shared[0]),
    carried: p.shared.slice(0, 6).map(k => ({ stage: '', dom: THEME_NAME[+k[0]], code: k })), carryName: p.shared.slice(0, 3).join('、') + (n > 3 ? '…' : ''),
    role: C_ROLES[i % C_ROLES.length], level: n >= 3 ? 'strong' : n === 2 ? 'suggest' : 'pending', n, mean: 0, stages: [],
    doms: [...new Set(p.shared.map(k => THEME_NAME[+k[0]]))],
    desc: `${p.A.name}和${p.B.name}都試教過 ${n} 份相同的教案。`,
    examples: p.shared.map(k => ({ stage: '', dom: THEME_NAME[+k[0]], code: k, content: topicOf(k), sim: '' })),
  };
});
// 每所學校一個「試教老師」小人（不顯示姓名），身後小孩代表學生
const cTeachers = cIslands.flatMap(isl => isl.items.map(it => ({
  name: it.name, school: isl.name, badge: it.level, submissions: it.submissions, students: it.students, itemId: it.id,
  themes: [...new Set(it.lessons.map(l => l.theme))], packages: it.lessons.map(l => ({ keyId: l.keyId, topic: l.topic, students: l.students })),
})));
const DATA_C = {
  title: '縣市試教群島', titleEn: 'County trial isles', mode: 'county',
  stats: { ...DATA.stats, cities: CD.cities.length, citySchools: CD.cities.reduce((a, c) => a + c.schools.length, 0),
    citySubs: CD.cities.reduce((a, c) => a + c.submissions, 0), cityStudents: CD.cities.reduce((a, c) => a + c.students, 0),
    noCity: CD.totals.submissions - CD.cities.reduce((a, c) => a + c.submissions, 0), asOf: (CD.generatedAt || '').slice(0, 10) },
  islands: cIslands.map(({ ax, az, rad, ...r }) => r), bridges: cBridges, flows: cFlows, dayCycle, teachers: cTeachers,
};
console.log(`縣市模式：島 ${cIslands.length}（有試教 ${cAct.length}、沙洲 ${cIslands.length - cAct.length}），學校 ${sid}，跨縣市線 ${cFlows.length}`);

const nItems = islands.reduce((a, i) => a + i.items.length, 0);
const tpl = fs.readFileSync(TPL, 'utf8');
if (!tpl.includes('/*__DATA__*/')) throw new Error('template missing /*__DATA__*/');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, tpl.replace("/*__DATA__*/", () => ["const DATA_T = " + JSON.stringify(DATA) + ";", "const DATA_C = " + JSON.stringify(DATA_C) + ";", "const MODE = new URLSearchParams(location.search).get('mode') === 'county' ? 'county' : 'theme';", "const DATA = MODE === 'county' ? DATA_C : DATA_T;"].join(String.fromCharCode(10))), "utf8");
console.log(`islands ${islands.length}, items ${nItems}, flows ${flows.length}, packages ${all.length}, teachers ${teachers.length}`);
flows.forEach(f => console.log(`  ${f.id} ${f.fromItem}→${f.toItem} n=${f.n} ${f.level} ${f.role} 搬運領域：${f.carried.map(c => c.dom).join('/')}`));
