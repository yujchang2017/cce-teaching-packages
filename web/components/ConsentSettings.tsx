"use client";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, consentChoice, setConsent } from "@/lib/track";

/** What is actually sent when statistics are on (track.ts + public/tracker.js). Keep in sync with those files. */
export const STATS_DISCLOSURE =
  "同意後，本站會匿名記錄：開啟了哪些教案、學習單與簡報；學習單上按了哪些按鈕與停留時間；遊戲的開始、重試、完成與結果摘要；" +
  "以及存在你瀏覽器裡的一組隨機匿名代碼、瀏覽器與裝置資訊、螢幕寬度、從哪個網站連過來。不收集姓名、學校或帳號，本站也不記錄 IP 位址。" +
  "不同意也能正常使用全部內容。";

/** Footer control to view or change the statistics choice on any page. */
export default function ConsentSettings() {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<boolean | null>(null);
  useEffect(() => {
    const sync = () => setChoice(consentChoice());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CONSENT_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const label = choice === null ? "尚未選擇（不送出統計）" : choice ? "已同意匿名使用統計" : "不參與統計";
  return <div className="text-xs text-mute">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="underline hover:text-sun">使用統計設定</button>
    {open && <div className="mt-2 max-w-xl rounded-xl border border-earth/15 bg-white p-3 space-y-2 text-ink/80">
      <p>{STATS_DISCLOSURE}</p>
      <p className="font-medium" role="status">目前：{label}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={choice === true} onClick={() => setConsent(true)} className="rounded-lg border border-forest/40 px-3 py-1.5 text-forest disabled:opacity-40">同意匿名統計</button>
        <button type="button" disabled={choice === false} onClick={() => setConsent(false)} className="rounded-lg border border-earth/30 px-3 py-1.5 disabled:opacity-40">不參與統計</button>
      </div>
    </div>}
  </div>;
}
