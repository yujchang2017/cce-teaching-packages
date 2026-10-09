/** 遊戲區清單：本計畫的研究遊戲與老師分享的遊戲都在這裡，新增一款＝在 teachingGames 加一筆。
 * 規則由 validateGames() 檢查（建置時與測試都會跑），不合規則會讓建置失敗，避免錯誤連結上線。
 * - 站內遊戲用站內路徑（/missions/...），Next Link 會自動加上 GitHub Pages basePath；
 * - 外部遊戲一律 https 絕對網址，另開新分頁；老師分享的連結另加 rel="ugc"。
 * - 截圖只用本站自己存放的 /games/<id>.png（老師分享的遊戲不放截圖，改用主題色卡片）。
 */
import type { Level } from './types';

export type GameSource = 'lab' | 'teacher';

export interface TeachingGame {
  /** 小寫英數與連字號，不可重複；截圖檔名也用它。 */
  id: string;
  /** 完整名稱（教案頁顯示）。 */
  title: string;
  /** 卡片標題（短）。 */
  shortTitle: string;
  /** 卡片上的一句話任務。 */
  mission: string;
  /** 較完整的介紹（教案頁、搜尋）。 */
  summary: string;
  /** 1–6 對應六大主題；0＝其他。 */
  themeNumber: number;
  levels: Level[];
  /** 相關教案編號（可空）。教案頁會列出對應的遊戲。 */
  keyIds: string[];
  minutes: string;
  href: string;
  source: GameSource;
  /** 分享者顯示名稱（老師分享時必填；本人同意的稱呼，例如「王老師」）。 */
  author?: string;
  /** 分享者學校（選填，本人同意才填）。 */
  school?: string;
  /** 只限本站存放的截圖路徑 /games/<id>.png。 */
  image?: string;
  /** 免費主機閒置會休眠，卡片提醒老師課前先開一次。 */
  coldStartNote?: string;
  /** 截圖角落的小標籤，例如「水路觀察原型」。 */
  badge?: string;
  /** 加入清單的日期 YYYY-MM-DD（「最新分享」依此排序）。 */
  addedAt: string;
}

export const themeNames = ['其他', '氣候科學', '生態系與生物多樣性', '氣候正義', '韌性建構', '後碳經濟', '永續生活型態'] as const;
export const sourceLabels: Record<GameSource, string> = { lab: '本計畫研究遊戲', teacher: '教師分享' };

/** 老師想分享遊戲時的聯絡信箱（由計畫主持人審核後，維護者加入清單）。空字串＝請對方用頁尾聯絡方式。 */
export const GAME_SHARE_CONTACT = 'yujchang@gmail.com';

/** Standalone research games (yjesdlab), deployed separately with their own consent and data store. */
export const PIZZA_GAME_URL = 'https://pizza-153495ced5e7.herokuapp.com/';
export const CARBON_GAME_URL = 'https://game-carbon-4ece53c592e9.herokuapp.com/';

const HEROKU_NOTE = '首次載入約需 10 秒';

export const teachingGames: readonly TeachingGame[] = [
  {
    id: 'carbon', source: 'lab', themeNumber: 1, levels: ['III'], keyIds: ['1.2-III'], addedAt: '2026-05-01',
    title: '校園碳排偵探：3D 配對任務', shortTitle: '校園碳排偵探',
    mission: '從設備與玩具中，找出符合題目的排放來源。',
    summary: '找出符合排放主題的相同一對，辨認燃燒、逸散與外購電力，留下玩具',
    minutes: '10–15', href: CARBON_GAME_URL, image: '/games/carbon.png', coldStartNote: HEROKU_NOTE,
  },
  {
    id: 'animals', source: 'lab', themeNumber: 2, levels: ['III'], keyIds: ['2.5-III'], addedAt: '2026-05-01',
    title: '幫動物，接回一條路：動物通道實驗室', shortTitle: '幫動物，接回一條路',
    mission: '配置橋梁、坡道與護欄，讓整群動物安全抵達。',
    summary: '配置坡道、護欄與涵洞，追蹤整群動物的抵達率',
    minutes: '15–20', href: '/missions/animals/', image: '/games/animals.png',
  },
  {
    id: 'heat', source: 'lab', themeNumber: 3, levels: ['III'], keyIds: ['3.2-III'], addedAt: '2026-05-01',
    title: '涼爽的路：都市降溫實驗室', shortTitle: '涼爽的路',
    mission: '用三棵樹改善遮蔭，讓居民辦完事還能安全回家。',
    summary: '在地圖種三棵樹，馬上看多少居民能平安回家；想深入可切換全 3D 檢視',
    minutes: '2–5', href: '/missions/heat/', image: '/games/heat.png',
  },
  {
    id: 'watershed', source: 'lab', themeNumber: 4, levels: ['III'], keyIds: ['4.2-III'], addedAt: '2026-05-01',
    title: '一場雨，兩條路：流域實驗室', shortTitle: '一場雨，兩條路',
    mission: '觀察地形、配置花園與水槽，再降雨驗證水的去向。',
    summary: '在山坡地圖放 2 個雨水設施，馬上看流進學校的水有沒有變少；想深入可切換全 3D 檢視',
    minutes: '2–5', href: '/missions/water/', image: '/games/watershed.png', badge: '水路觀察原型',
  },
  {
    id: 'recycling', source: 'lab', themeNumber: 5, levels: ['III'], keyIds: ['5.2-III'], addedAt: '2026-05-01',
    title: '產品回家之後：為回收而設計', shortTitle: '產品回家之後',
    mission: '拆解、分類、改設計，看看怎樣降低回收成本。',
    summary: '拆解與分類小燈，改良螺絲、材質和電池模組，比較回收成本',
    minutes: '15–20', href: '/missions/recycling/', image: '/games/recycling.png',
  },
  {
    id: 'pizza', source: 'lab', themeNumber: 6, levels: ['III'], keyIds: ['6.6-III'], addedAt: '2026-05-01',
    title: '一人一半，怎麼切？3D 披薩分配實驗室', shortTitle: '一人一半，怎麼切？',
    mission: '畫一刀，同時兼顧兩份配料的碳足跡與營養。',
    summary: '畫出切線分開披薩，同時兼顧兩份的配料碳足跡與營養分配',
    minutes: '10–15', href: PIZZA_GAME_URL, image: '/games/pizza.png', coldStartNote: HEROKU_NOTE,
  },
];

const LEVELS: readonly Level[] = ['II', 'III', 'IV', 'V'];
const KEY_ID = /^\d+\.\d+-(II|III|IV|V)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isExternalGame(game: Pick<TeachingGame, 'href'>): boolean {
  return /^https?:\/\//.test(game.href);
}

/** 回傳所有不合規則的地方（空陣列＝全部合格）。 */
export function validateGames(games: readonly TeachingGame[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const g of games) {
    const at = `遊戲 ${g.id || '(沒有 id)'}`;
    if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(g.id)) errors.push(`${at}：id 只能用小寫英數與連字號`);
    if (ids.has(g.id)) errors.push(`${at}：id 重複`);
    ids.add(g.id);
    if (g.source !== 'lab' && g.source !== 'teacher') errors.push(`${at}：source 必須是 lab 或 teacher`);
    for (const [field, max] of [['title', 60], ['shortTitle', 24], ['mission', 60], ['summary', 120], ['minutes', 12]] as const) {
      const v = g[field];
      if (typeof v !== 'string' || !v.trim() || v.length > max) errors.push(`${at}：${field} 必填且不超過 ${max} 字`);
    }
    if (!Number.isInteger(g.themeNumber) || g.themeNumber < 0 || g.themeNumber > 6) errors.push(`${at}：themeNumber 必須是 0–6`);
    if (!g.levels.length || g.levels.some(l => !LEVELS.includes(l))) errors.push(`${at}：levels 至少一個，且只能是 II／III／IV／V`);
    if (g.keyIds.some(k => !KEY_ID.test(k))) errors.push(`${at}：keyIds 格式應像 1.2-III`);
    if (!DATE.test(g.addedAt)) errors.push(`${at}：addedAt 格式應為 YYYY-MM-DD`);
    if (isExternalGame(g)) {
      let url: URL | null = null;
      try { url = new URL(g.href); } catch { /* reported below */ }
      if (!url || url.protocol !== 'https:' || url.username || url.password || g.href.length > 300)
        errors.push(`${at}：外部網址必須是 https、不含帳密、300 字以內`);
    } else if (g.source !== 'lab' || !/^\/missions\/[a-z0-9-]+\/$/.test(g.href)) {
      errors.push(`${at}：站內路徑只限本計畫遊戲（/missions/<名稱>/），老師分享必須是 https 外部網址`);
    }
    if (g.image !== undefined && (g.source !== 'lab' || g.image !== `/games/${g.id}.png`)) errors.push(`${at}：截圖只限本計畫遊戲，路徑為 /games/<id>.png`);
    if (g.source === 'teacher' && !g.author?.trim()) errors.push(`${at}：老師分享的遊戲要填 author（本人同意的稱呼）`);
    for (const [field, max] of [['author', 20], ['school', 30], ['badge', 12], ['coldStartNote', 20]] as const) {
      const v = g[field];
      if (v !== undefined && (typeof v !== 'string' || v.length > max)) errors.push(`${at}：${field} 不超過 ${max} 字`);
    }
  }
  return errors;
}

// 清單有錯就讓建置失敗（錯誤訊息會列出是哪一款、哪一欄）。
const problems = validateGames(teachingGames);
if (problems.length) throw new Error(`遊戲清單有誤：\n${problems.join('\n')}`);

/** 連結屬性：外部另開新分頁；老師分享的另加 ugc（使用者提供的內容）。 */
export function gameLinkProps(game: Pick<TeachingGame, 'href' | 'source'>): { target?: '_blank'; rel?: string } {
  if (!isExternalGame(game)) return {};
  return { target: '_blank', rel: game.source === 'teacher' ? 'ugc noopener noreferrer' : 'noopener noreferrer' };
}

export function getGamesForPackage(keyId: string): TeachingGame[] {
  return teachingGames.filter(game => game.keyIds.includes(keyId));
}

/** 教案卡片上的「遊戲」捷徑只放一款：優先本計畫的遊戲。 */
export function getGameForPackage(keyId: string): TeachingGame | undefined {
  const games = getGamesForPackage(keyId);
  return games.find(g => g.source === 'lab') ?? games[0];
}

/** 首頁精選：本計畫遊戲依主題排列，加上最新的幾款老師分享。 */
export function featuredGames(teacherCount = 3): TeachingGame[] {
  const lab = teachingGames.filter(g => g.source === 'lab').sort((a, b) => a.themeNumber - b.themeNumber);
  const teacher = teachingGames.filter(g => g.source === 'teacher').sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, teacherCount);
  return [...lab, ...teacher];
}
