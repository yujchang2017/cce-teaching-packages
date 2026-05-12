"use client";
import { track } from "@/lib/track";
import type { ReactNode, MouseEvent } from "react";

interface Props {
  href: string;
  event: string;
  resource?: string;
  meta?: Record<string, unknown>;
  className?: string;
  target?: string;
  rel?: string;
  children: ReactNode;
}

/** 點擊時送事件，再依 target 開連結 */
export default function TrackLink({ href, event, resource, meta, className, target, rel, children }: Props) {
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    track({ event, resource, meta });
    // 不阻擋預設行為，讓瀏覽器照常開連結
    void e;
  }
  return (
    <a href={href} target={target} rel={rel} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
