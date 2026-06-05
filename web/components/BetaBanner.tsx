// Global beta banner — displayed on all pages to set expectations
// that the site is in active development with incomplete features.

export default function BetaBanner() {
  return (
    <div className="bg-gradient-to-r from-sun/90 to-sunDeep/90 text-white text-xs sm:text-sm py-2 px-4 text-center border-b border-sunDeep/30">
      <span className="inline-flex items-center gap-2 flex-wrap justify-center">
        <span className="font-bold">🚧 BETA 測試中</span>
        <span className="opacity-90">目前以試教／回饋收集與統計為主，審查與合併流程暫時擱置</span>
      </span>
    </div>
  );
}
