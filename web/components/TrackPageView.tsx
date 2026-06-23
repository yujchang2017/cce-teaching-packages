"use client";
import { useEffect } from "react";
import { track } from "@/lib/track";

interface Props {
  event: string;
  resource?: string;
  meta?: Record<string, unknown>;
}

/** 掛在 page 任一處，render 時送一次 page-view，離開時送 page_leave + 停留時間 */
export default function TrackPageView({ event, resource, meta }: Props) {
  useEffect(() => {
    track({ event, resource, meta });
    const t0 = Date.now();
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        const ms = Date.now() - t0;
        if (ms > 1000) track({ event: "page_leave", resource, meta: { ...meta, durationMs: ms } });
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [event, resource, meta]);
  return null;
}
