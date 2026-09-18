// Pseudonymous usage statistics: shared consent + UUID → existing Apps Script.
const UUID_KEY = 'cce_uuid_v1';
const CONSENT_KEY = 'cce_track_consent_v1';
const SID_KEY = 'cce_session_id';
export const CONSENT_EVENT = 'cce:tracking-consent';

function getSessionId(): string {
  let sid = sessionStorage.getItem(SID_KEY);
  if (!sid) { sid = crypto.randomUUID().slice(0, 8); sessionStorage.setItem(SID_KEY, sid); }
  return sid;
}
export function getUuid(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(UUID_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(UUID_KEY, id); }
  return id;
}
export function consentChoice(): boolean | null {
  if (typeof window === 'undefined') return null;
  try { const choice = localStorage.getItem(CONSENT_KEY); return choice === '1' ? true : choice === '0' ? false : null; }
  catch { return false; }
}
export function hasConsent(): boolean { return consentChoice() === true; }
export function setConsent(value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const changed = consentChoice() !== value;
    localStorage.setItem(CONSENT_KEY, value ? '1' : '0');
    if (changed) window.dispatchEvent(new Event(CONSENT_EVENT));
  } catch { /* Unavailable storage means no consent and no tracking. */ }
}
export interface TrackEvent { event: string; resource?: string; meta?: Record<string, unknown> }
export function track(ev: TrackEvent) {
  if (typeof window === 'undefined' || !hasConsent()) return;
  const url = process.env.NEXT_PUBLIC_TRACK_URL;
  if (!url) return;
  try {
    const payload = JSON.stringify({
      uuid: getUuid(), event: ev.event, resource: ev.resource ?? '',
      meta: { ...ev.meta, sid: getSessionId(),
        ref: (() => { try { return new URL(document.referrer).hostname; } catch { return ''; } })(),
        sw: window.screen?.width ?? 0 },
      userAgent: navigator.userAgent,
    });
    // Fall back when the beacon queue is full; absorb asynchronous failures too.
    if (navigator.sendBeacon?.(url, new Blob([payload], { type: 'text/plain;charset=UTF-8' }))) return;
    void fetch(url, { method: 'POST', body: payload, keepalive: true, mode: 'no-cors' }).catch(() => {});
  } catch { /* Storage, crypto and transport failures never interrupt the page. */ }
}
