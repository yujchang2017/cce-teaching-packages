import type { TeachingPackage } from '@/lib/types';

export default function Breadcrumb({ pkg }: { pkg: TeachingPackage }) {
  return (
    <nav className="text-sm text-mute mb-6 flex flex-wrap items-center gap-1.5">
      <a href="#" className="hover:text-sun transition">首頁</a>
      <span className="text-earth/40">›</span>
      <a href="#" className="hover:text-sun transition">
        國小中高年級 (Level {pkg.level})
      </a>
      <span className="text-earth/40">›</span>
      <a href="#" className="hover:text-sun transition">
        主題 {pkg.themeNumber}：{pkg.themeName}
      </a>
      <span className="text-earth/40">›</span>
      <span className="text-ink font-medium">
        {pkg.keyId} {pkg.topic}
      </span>
    </nav>
  );
}
