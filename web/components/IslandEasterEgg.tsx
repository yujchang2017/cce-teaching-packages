"use client";
import { useRef, type ReactNode } from "react";

interface Props {
  href: string;
  children: ReactNode;
}

/** 彩蛋：首頁標題在 1.2 秒內連點 3 下，進入「氣候教案群島」3D 頁（手機點擊也可以） */
export default function IslandEasterEgg({ href, children }: Props) {
  const clicks = useRef<number[]>([]);
  const onClick = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter(t => now - t < 1200), now];
    if (clicks.current.length >= 3) {
      clicks.current = [];
      window.location.href = href;
    }
  };
  return <span onClick={onClick}>{children}</span>;
}
