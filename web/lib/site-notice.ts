/** 首頁標題下方的重點卡片（取代原本的遊戲試玩框）。要換內容就改這裡；設為 null 即不顯示。
 * href 只能是本站路徑（/ 開頭）或 https 網址。 */
export interface SiteNotice { id: string; label: string; title: string; text: string; href: string; linkText: string }

export const siteNotice: SiteNotice | null = {
  id: 'unesco-nodes-20261009',
  label: '重要指引',
  title: '國中小 UNESCO 優先節點',
  text: '各學習階段建議優先採用的 6 個節點，以及適合融入的領域與代表單元',
  href: '/reports/unesco-nodes.html',
  linkText: '查看指引 →',
};

export function isSafeNoticeHref(href: string): boolean {
  if (/^\/(?!\/)/.test(href)) return true;
  try { const u = new URL(href); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}
