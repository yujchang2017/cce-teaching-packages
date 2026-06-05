"use client";

import { useEffect, useState } from "react";

type SiteStatus = "testing" | "beta" | "live";

const status = (process.env.NEXT_PUBLIC_SITE_STATUS || "testing").toLowerCase() as SiteStatus;
const message =
  process.env.NEXT_PUBLIC_SITE_STATUS_MESSAGE ||
  "本網站目前為測試版，現階段以試教／回饋收集與統計為主。";

export default function SiteStatusNotice() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (status !== "testing") return;
    if (window.sessionStorage.getItem("cce-site-status-seen") === "1") return;

    window.sessionStorage.setItem("cce-site-status-seen", "1");
    setShowSplash(true);

    const timer = window.setTimeout(() => setShowSplash(false), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  if (status === "live") return null;

  const isTesting = status === "testing";
  const label = isTesting ? "測試中" : "BETA";

  return (
    <>
      <div className="site-status-banner" role="status" aria-live="polite">
        <span className="site-status-label">{label}</span>
        <span>{message}</span>
      </div>

      {isTesting ? <div className="site-status-ribbon" aria-hidden="true">TEST / 測試中</div> : null}

      {showSplash ? (
        <div className="site-status-splash" aria-hidden="true">
          <div className="site-status-splash-text">測試中</div>
        </div>
      ) : null}
    </>
  );
}