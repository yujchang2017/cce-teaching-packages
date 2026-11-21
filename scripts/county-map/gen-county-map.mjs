// 產生「縣市試教成果島」彩蛋頁（首頁「🏫 學校上傳件數排行」標題連點 3 下進入）：真實台灣縣市輪廓＋各縣市試教成果
// 建置時由 GitHub Actions 執行（見 .github/workflows/build-and-deploy.yml），輸出不進版控。
// 用法（在 web/ 下）：node ../scripts/county-map/gen-county-map.mjs --stats data/stats.json --out public/county-map/index.html
// 資料：stats.json 的 countyIsles（fetch-stats.mjs 產生：各校完整校名＋縣市＋教案、每月筆數；沒有老師姓名）
// 地圖：counties-10t.json＝taiwan-atlas@2021.9.20（MIT），源自內政部國土測繪中心「直轄市、縣市界線」（政府資料開放授權條款第1版）
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = name => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : undefined; };
const STATS = arg('stats') || 'data/stats.json', OUT = arg('out') || 'public/county-map/index.html';
const ST = fs.existsSync(STATS) ? JSON.parse(fs.readFileSync(STATS, 'utf8')) : {};
const CI = ST.countyIsles || { schools: [], unplacedSubmissions: 0, byMonth: [], noDateSubmissions: 0 };

const cities = new Map();
for (const s of CI.schools) {
  if (!cities.has(s.city)) cities.set(s.city, { city: s.city, schools: [], submissions: 0, students: 0, teachers: 0 });
  const c = cities.get(s.city);
  c.schools.push(s); c.submissions += s.submissions; c.students += s.students; c.teachers += s.teachers;
}
const list = [...cities.values()].sort((a, b) => b.submissions - a.submissions);
list.forEach(c => c.schools.sort((a, b) => b.submissions - a.submissions));
const DATA = {
  generatedAt: ST.generatedAt || new Date().toISOString(), source: 'stats.json countyIsles',
  totals: { submissions: ST.totalSubmissions || 0, students: ST.totalStudents || 0, schools: CI.schools.length, cities: list.length },
  themeNames: ST.themeNames || {}, cities: list,
};
const asOf = (ST.generatedAt || '').slice(0, 10);
const months = CI.byMonth || [];
const total = months.reduce((a, m) => a + m.n, 0) + (CI.noDateSubmissions || 0);
const thisMonth = asOf.slice(0, 7);
const MONTHLY = {
  months,
  note: `依「試教日期」分月，與地圖同一份試教回饋資料（${asOf}），共 ${total} 筆` +
    (CI.noDateSubmissions ? `；其中 ${CI.noDateSubmissions} 筆未填或日期無法辨識，不列入長條圖` : '') +
    (months.some(m => m.m === thisMonth) ? `；${+thisMonth.slice(5)} 月尚未結束` : '') + '。',
};
const topo = fs.readFileSync(path.join(HERE, 'counties-10t.json'), 'utf8');
JSON.parse(topo);
let tpl = fs.readFileSync(path.join(HERE, 'template.html'), 'utf8');
for (const [k, v] of [['/*__TOPO__*/null', topo], ['/*__DATA__*/null', JSON.stringify(DATA)], ['/*__MONTHLY__*/null', JSON.stringify(MONTHLY)]]) {
  if (tpl.split(k).length !== 2) throw new Error('template placeholder missing or duplicated: ' + k);
  tpl = tpl.replace(k, () => v);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, tpl, 'utf8');
console.log(`county-map: ${list.length} 縣市、${CI.schools.length} 校、地圖上 ${list.reduce((a, c) => a + c.submissions, 0)} 筆（另 ${CI.unplacedSubmissions} 筆不在地圖上）→ ${OUT}`);
