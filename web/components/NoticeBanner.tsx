"use client";
import { useEffect, useState } from "react";
import { isSafeNoticeHref, siteNotice } from "@/lib/site-notice";

const DISMISS_KEY = "cce_notice_dismissed";

function withBasePath(href: string) {
  if (!href.startsWith("/")) return href;
  const explicit = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  const base = explicit !== undefined ? (explicit === "/" ? "" : explicit) : process.env.CUSTOM_DOMAIN?.trim() ? "" : "/cce-teaching-packages";
  return `${base}${href}`;
}

/** One-line announcement under the homepage title. Closing it hides this notice id on this browser only. */
export default function NoticeBanner() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try { if (siteNotice && localStorage.getItem(DISMISS_KEY) === siteNotice.id) setHidden(true); } catch { /* storage blocked: keep showing */ }
  }, []);
  const notice = siteNotice;
  if (!notice || hidden || !isSafeNoticeHref(notice.href)) return null;
  const external = !notice.href.startsWith("/");
  const close = () => {
    try { localStorage.setItem(DISMISS_KEY, notice.id); } catch { /* ignore */ }
    setHidden(true);
  };
  return (
    <div role="region" aria-label="重要公告" className="mt-4 flex items-center gap-2 rounded-full border border-sun/30 bg-white/85 pl-2 pr-1 py-1 text-sm max-w-full">
      <span className="shrink-0 rounded-full bg-sun text-white text-xs font-bold px-2.5 py-0.5">📢 {notice.label}</span>
      <a href={withBasePath(notice.href)} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="min-w-0 flex-1 truncate text-ink hover:text-sun">
        {notice.text}<span className="ml-2 font-semibold text-forest whitespace-nowrap">{notice.linkText}</span>
      </a>
      <button type="button" onClick={close} aria-label="關閉這則公告" className="shrink-0 rounded-full w-7 h-7 text-mute hover:bg-earth/10 hover:text-ink">×</button>
    </div>
  );
}
