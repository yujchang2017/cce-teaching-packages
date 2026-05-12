// 匿名使用統計：UUID + sendBeacon → Google Apps Script
// 前端公開，後端僅 append 到 Google Sheets

const UUID_KEY = "cce_uuid_v1";
const CONSENT_KEY = "cce_track_consent_v1";

export function getUuid(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(UUID_KEY);
  if (!id) {
    id = (crypto as Crypto & { randomUUID: () => string }).randomUUID();
    localStorage.setItem(UUID_KEY, id);
  }
  return id;
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "1";
}

export function setConsent(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, value ? "1" : "0");
}

export interface TrackEvent {
  event: string;            // e.g. "view_home" | "view_package" | "open_worksheet" | "open_ppt"
  resource?: string;        // e.g. keyId 或 URL
  meta?: Record<string, unknown>;
}

export function track(ev: TrackEvent) {
  if (typeof window === "undefined") return;
  if (!hasConsent()) return;

  const url = process.env.NEXT_PUBLIC_TRACK_URL;
  if (!url) return;

  const payload = JSON.stringify({
    uuid: getUuid(),
    event: ev.event,
    resource: ev.resource ?? "",
    meta: ev.meta ?? {},
    userAgent: navigator.userAgent,
  });

  try {
    // sendBeacon：頁面跳轉時也能送出，不阻塞
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "text/plain;charset=UTF-8" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, { method: "POST", body: payload, keepalive: true, mode: "no-cors" });
    }
  } catch {
    /* 失敗就算了，不影響使用 */
  }
}
