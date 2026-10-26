// Forwarding page for a research game that moved to its own yjesdlab site; keeps old links and bookmarks working.
export default function MovedGame({ title, url }: { title: string; url: string }) {
  return <main className="max-w-xl mx-auto px-4 py-16 text-center">
    <meta httpEquiv="refresh" content={`0;url=${url}`}/>
    <h1 className="text-2xl font-bold text-ink mb-4">遊戲已搬家</h1>
    <p className="text-ink/75 leading-relaxed mb-6">「{title}」已搬到研究計畫網站，正在為您轉過去；首次載入約需 10 秒。</p>
    <a href={url} className="inline-block rounded-xl bg-forest text-white font-bold px-6 py-3">沒有自動跳轉？點這裡前往 ↗</a>
  </main>;
}
