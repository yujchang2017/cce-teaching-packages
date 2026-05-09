import type { NextConfig } from "next";

// 有 custom domain → 不用 basePath
// 沒有 → 用 /cce-tw-lite (GitHub Pages project site)
// 也允許用 NEXT_PUBLIC_BASE_PATH 覆蓋
const customDomain = process.env.CUSTOM_DOMAIN?.trim();
const explicit = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
const basePath =
  explicit !== undefined
    ? (explicit && explicit !== "/" ? explicit : undefined)
    : customDomain
    ? undefined
    : "/cce-tw-lite";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
