export default function Footer() {
  return (
    <footer className="bg-earth/5 border-t border-earth/15 mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-sm text-ink/80">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="font-bold text-ink mb-2 flex items-center gap-2">🏛️ 計畫資訊</div>
            <p className="text-xs leading-relaxed text-mute">
              115 年中小學氣候變遷教育推動計畫
              <br />
              主辦：教育部資訊及科技教育司
              <br />
              執行：臺北市立大學
              <br />
              教材依據：UNESCO《綠色課程指南：氣候行動的教學與學習》
            </p>
          </div>
          <div>
            <div className="font-bold text-ink mb-2 flex items-center gap-2">📜 授權</div>
            <p className="text-xs leading-relaxed text-mute">
              本教案採用 <b className="text-forest">CC BY-SA 4.0</b> 授權
              <br />
              可自由改編與分享，改編後需採相同授權
              <br />
              歡迎老師依在地情境調整
            </p>
          </div>
          <div>
            <div className="font-bold text-ink mb-2 flex items-center gap-2">✉️ 聯絡</div>
            <p className="text-xs leading-relaxed text-mute">
              <a href="mailto:yujchang@gmail.com" className="text-sun hover:underline">yujchang@gmail.com</a>
              <br />
              張育傑教授（計畫主持人）
            </p>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-earth/15 text-xs text-mute flex flex-wrap gap-2 justify-between">
          <span>© 2026 community.cce.tw · 本站所有教案以 CC BY-SA 4.0 授權</span>
          <span className="text-sun/70">🚧 Beta 測試中 · 部分功能尚未實裝</span>
        </div>
      </div>
    </footer>
  );
}
