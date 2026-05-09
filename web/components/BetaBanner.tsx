// Global beta banner — displayed on all pages to set expectations
// that the site is in active development with incomplete features.

export default function BetaBanner() {
  return (
    <div className="bg-gradient-to-r from-sun/90 to-sunDeep/90 text-white text-xs sm:text-sm py-2 px-4 text-center border-b border-sunDeep/30">
      <span className="inline-flex items-center gap-2 flex-wrap justify-center">
        <span className="font-bold">🚧 BETA 測試中</span>
        <span className="opacity-90">本站正在開發中，部分功能尚未完整（例如：搜尋排序、審核合併、徽章授予）</span>
      </span>
    </div>
  );
}
