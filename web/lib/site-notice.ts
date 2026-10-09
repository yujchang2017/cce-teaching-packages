/** 首頁標題下方的一行重要公告。要換公告就改這裡（換新的 id，之前關掉的人才會再看到）；設為 null 即不顯示。
 * href 只能是本站路徑（/ 開頭）或 https 網址。 */
export interface SiteNotice { id: string; label: string; text: string; href: string; linkText: string }

export const siteNotice: SiteNotice | null = {
  id: 'unesco-nodes-20261009',
  label: '新報告',
  text: '國中小 UNESCO 節點推薦：各學習階段建議優先採用的 6 個節點',
  href: '/reports/unesco-nodes.html',
  linkText: '查看報告 →',
};

export function isSafeNoticeHref(href: string): boolean {
  if (/^\/(?!\/)/.test(href)) return true;
  try { const u = new URL(href); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}
