"use client";

import { useEffect, useRef } from "react";

interface GiscusProps {
  term: string; // mapping term (e.g. keyId)
}

export default function Giscus({ term }: GiscusProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.querySelector("iframe")) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "yujchang2017/cce-teaching-packages");
    script.setAttribute("data-repo-id", "R_kgDOSEdOIQ");
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDOSEdOIc4DAHAP");
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", term);
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "light");
    script.setAttribute("data-lang", "zh-TW");
    script.setAttribute("data-loading", "lazy");
    script.crossOrigin = "anonymous";
    script.async = true;

    ref.current.appendChild(script);
  }, [term]);

  return <div ref={ref} />;
}
