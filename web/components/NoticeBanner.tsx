import { isSafeNoticeHref, siteNotice } from "@/lib/site-notice";

function withBasePath(href: string) {
  if (!href.startsWith("/")) return href;
  const explicit = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  const base = explicit !== undefined ? (explicit === "/" ? "" : explicit) : process.env.CUSTOM_DOMAIN?.trim() ? "" : "/cce-teaching-packages";
  return `${base}${href}`;
}

/** Prominent card under the homepage title for the current key guide (not dismissible). */
export default function NoticeBanner() {
  const notice = siteNotice;
  if (!notice || !isSafeNoticeHref(notice.href)) return null;
  const external = !notice.href.startsWith("/");
  return (
    <a href={withBasePath(notice.href)} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={`${notice.label}：${notice.title}`}
      className="group mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-gradient-to-r from-forest to-[#2F5A3A] p-5 sm:p-6 text-white shadow-warm-lg ring-2 ring-sun/60 hover:ring-sun focus-visible:outline-4 focus-visible:outline-sun transition">
      <span className="text-4xl shrink-0" aria-hidden="true">📘</span>
      <div className="flex-1 min-w-52">
        <p className="inline-block rounded-full bg-sun px-3 py-0.5 text-xs font-bold text-white mb-2">{notice.label}</p>
        <p className="text-xl sm:text-2xl font-bold leading-snug">{notice.title}</p>
        <p className="text-sm sm:text-base text-white/85 mt-1">{notice.text}</p>
      </div>
      <span className="shrink-0 rounded-xl bg-white text-forest font-bold px-5 py-3 text-sm sm:text-base group-hover:bg-sun group-hover:text-white transition">{notice.linkText}</span>
    </a>
  );
}
