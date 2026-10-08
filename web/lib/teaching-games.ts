/** Only playable prototypes belong here. Future concepts live in docs/teaching-games-pilot.md.
 * A package can add a game alongside its worksheet and slides, without changing either asset.
 * Keep href app-relative: Next Link applies the configured GitHub Pages basePath.
 * Research games hosted outside this site use an absolute https URL instead (see isExternalGame).
 */
export interface TeachingGame {
  id: string;
  keyId: string;
  themeNumber: number;
  title: string;
  summary: string;
  minutes: string;
  href: string;
  /** Free-tier hosts sleep when idle; shown on the card so teachers open the game before class. */
  coldStartNote?: string;
}

/** Standalone research game (yjesdlab), deployed separately with its own consent and data store. */
export const PIZZA_GAME_URL = 'https://pizza-153495ced5e7.herokuapp.com/';
export const CARBON_GAME_URL = 'https://game-carbon-4ece53c592e9.herokuapp.com/';

export const teachingGames: readonly TeachingGame[] = [
  {
    id: 'pizza', keyId: '6.6-III', themeNumber: 6,
    title: '一人一半，怎麼切？3D 披薩分配實驗室',
    summary: '畫出切線分開披薩，同時兼顧兩份的配料碳足跡與營養分配',
    minutes: '10–15', href: PIZZA_GAME_URL,
    coldStartNote: '首次載入約需 10 秒',
  },
  {
    id: 'carbon', keyId: '1.2-III', themeNumber: 1,
    title: '校園碳排偵探：3D 配對任務',
    summary: '找出符合排放主題的相同一對，辨認燃燒、逸散與外購電力，留下玩具',
    minutes: '10–15', href: CARBON_GAME_URL,
    coldStartNote: '首次載入約需 10 秒',
  },
  {
    id: 'watershed',
    keyId: '4.2-III',
    themeNumber: 4,
    title: '一場雨，兩條路：流域實驗室',
    summary: '在山坡地圖放 2 個雨水設施，馬上看流進學校的水有沒有變少；想深入可切換全 3D 檢視',
    minutes: '2–5',
    href: '/missions/water/',
  },
  {
    id: 'animals', keyId: '2.5-III', themeNumber: 2,
    title: '幫動物，接回一條路：動物通道實驗室',
    summary: '配置坡道、護欄與涵洞，追蹤整群動物的抵達率',
    minutes: '15–20', href: '/missions/animals/',
  },
  {
    id: 'heat', keyId: '3.2-III', themeNumber: 3,
    title: '涼爽的路：都市降溫實驗室',
    summary: '在地圖種三棵樹，馬上看多少居民能平安回家；想深入可切換全 3D 檢視',
    minutes: '2–5', href: '/missions/heat/',
  },
  {
    id: 'recycling', keyId: '5.2-III', themeNumber: 5,
    title: '產品回家之後：為回收而設計',
    summary: '拆解與分類小燈，改良螺絲、材質和電池模組，比較回收成本',
    minutes: '15–20', href: '/missions/recycling/',
  },
];

export function isExternalGame(game: Pick<TeachingGame, 'href'>): boolean {
  return /^https?:\/\//.test(game.href);
}

export function getGameForPackage(keyId: string): TeachingGame | undefined {
  return teachingGames.find(game => game.keyId === keyId);
}
