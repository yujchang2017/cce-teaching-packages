import Link from 'next/link';

export default function MainCTA({
  worksheetUrl,
  keyId,
}: {
  worksheetUrl: string;
  keyId: string;
}) {
  return (
    <section className="bg-gradient-to-br from-sun to-sunDeep rounded-2xl p-6 sm:p-8 shadow-warm-lg mb-10 text-white relative overflow-hidden">
      <div className="absolute -right-8 -top-8 text-8xl opacity-10 select-none pointer-events-none">✏️</div>
      <div className="relative flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold mb-1">
            想把這份教案改成適合你班上的版本嗎？
          </h2>
          <p className="text-white/90 text-sm">
            30 分鐘內可完成改編申請 · 通過審核可得 <b>研習時數</b> + <b>改編徽章</b>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
          <Link
            href={`/remix/${keyId}`}
            className="cta-main bg-white text-sunDeep font-bold text-base px-6 py-3.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:bg-cream transition-all text-center"
          >
            ✏️ 我要改編這個教案
          </Link>
          <a
            href={worksheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/15 hover:bg-white/25 backdrop-blur text-white font-medium px-5 py-3.5 rounded-xl border border-white/30 transition text-center"
          >
            👁️ 預覽互動學習單
          </a>
          <button
            type="button"
            className="bg-ink/30 hover:bg-ink/40 text-white font-medium px-5 py-3.5 rounded-xl border border-white/20 transition"
          >
            ⬇️ 下載整包 ZIP
          </button>
        </div>
      </div>
    </section>
  );
}
