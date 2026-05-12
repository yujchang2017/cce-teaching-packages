"use client";
import { useEffect, useState } from "react";
import { setConsent } from "@/lib/track";

const STORAGE_KEY = "cce_disclaimer_v2";

export default function DisclaimerModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setConsent(true);
    setVisible(false);
  }

  function declineStats() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(40,30,20,0.55)", backdropFilter: "blur(4px)" }}
      onClick={dismiss}
    >
      <div
        className="relative max-w-2xl w-full rounded-2xl shadow-2xl border border-earth/20 p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
        style={{ background: "rgba(255,247,229,0.97)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題 */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">📋</span>
          <div>
            <h2 className="text-lg font-bold text-ink leading-snug">關於本教學資源庫</h2>
            <p className="text-xs text-mute mt-0.5">臺北市立大學 中小學氣候變遷教育推動計畫團隊</p>
          </div>
        </div>

        {/* 正文 */}
        <div className="text-sm text-ink/85 leading-relaxed space-y-3">
          <p>
            本網頁所建構的教學資源，是運用教育部資科司這幾年所建構的氣候變遷議題相關教學示例，以及 114 年中小學氣候變遷教育推動計畫所收集的氣候變遷國內外相關教學資源，以及 UNESCO 的綠色課程指南的學習成果作為基礎，運用人工智慧多次遞迴推論所產生而出的。
          </p>
          <p>
            本網站的目的，是讓不同學習階段、不同領域的教師，在既有領域的教學負擔下，有一個可參考、易取得的教學資源可供使用。我們所設計這些教學資源的理念是，在既有的領域教學負荷下，配合本計畫前一年度所發展的語意檢索工具，可快速比對得到最適合融入領域的主要觀點，進而可以搜尋到對應的教學計畫（教案，lesson plan）。
          </p>
          <p>
            在本計畫所產出的「教案」係由 3〜4 個小活動所組合而成，遵循 UNESCO 的學習成果。因此，忙碌的師長們，可以快速取用其中容易駕馭、理解、操作的活動逕行取用，做到最有效率的融入。互動式的學習單是本計畫所產出教學資源的一大特色，在生生有平板的環境下，學生可以運用平板進行適性的學習。
          </p>
          <p>
            為了方便大家取用以及管理，所有的教學資源幾乎都是用 HTML 的格式進行設計。因此很多的圖表、圖片難免會有必須遷就於檔案格式的限制，無法更佳的呈現。但是我們還是盡力的去尋求整體的平衡輸出。
          </p>
          <p className="text-earth font-medium">
            目前雖然這些素材已經經過多次的檢視與測試，但是由於數量龐大，仍需具有相當專業的學者專家們分批的進行審查與修正，在尚未完成所有審查程序的情況下，目前僅進行內部與邀請對象的試用。因此，請試用的師長們酌量取用並持續給我們回饋與指正。
          </p>
          <p className="text-xs text-mute pt-3 border-t border-earth/20">
            📊 為了改善教學資源，本站會匿名記錄哪些教案、學習單、簡報被開啟（不收集姓名、IP、學校等個資）。
          </p>
        </div>

        {/* 按鈕 */}
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
          <button
            onClick={declineStats}
            className="text-mute hover:text-earth py-2.5 px-5 rounded-xl transition text-sm"
          >
            不參與統計
          </button>
          <button
            onClick={dismiss}
            className="bg-forest hover:bg-forest/90 text-white font-bold py-2.5 px-7 rounded-xl transition shadow-warm text-sm"
          >
            了解，進入教案庫 →
          </button>
        </div>
      </div>
    </div>
  );
}
