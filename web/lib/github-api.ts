// Backward-compatible re-export 層
// 舊 app_sample 的 page.tsx 都 import from "@/lib/github-api"
// Lite 版改從 packages.ts (build-time JSON) 讀,但保留同樣的 API 介面
export {
  fetchAllPackages,
  fetchPackageDetail,
  getAllPackages,
  getAllKeyIds,
} from "./packages";
export type { DataCard, PackageDetail, RemixEntry } from "./packages";
