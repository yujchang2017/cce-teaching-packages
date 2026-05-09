import type { ArtifactFile } from '@/lib/types';

export default function ArtifactGrid({ files }: { files: ArtifactFile[] }) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-ink flex items-center gap-2">
          📦 這個教案包含的 {files.length} 個檔案
        </h3>
        <span className="text-xs text-mute">點「預覽」在新分頁打開</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {files.map((file) => (
          <article
            key={file.filename}
            className={`bg-white rounded-xl p-5 shadow-warm border transition group ${
              file.highlight
                ? 'border-sun/40 ring-1 ring-sun/20'
                : 'border-earth/10 hover:border-sun/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-lg ${file.bgClass} flex items-center justify-center text-2xl shrink-0`}
              >
                {file.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <h4 className="font-bold text-ink">{file.name}</h4>
                  <code className="text-[11px] text-mute bg-sand/60 px-1.5 py-0.5 rounded">
                    {file.filename}
                  </code>
                  {file.highlight && (
                    <span className="text-[10px] bg-sun text-white px-1.5 py-0.5 rounded-full">
                      學生用
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink/70 mb-3">{file.description}</p>
                {file.previewUrl ? (
                  <a
                    href={file.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs bg-sun hover:bg-sunDeep text-white font-medium px-3 py-1.5 rounded-full transition"
                  >
                    👁️ 開啟預覽（新分頁）
                  </a>
                ) : (
                  <button
                    type="button"
                    className="text-xs bg-sand/70 hover:bg-sand text-earth font-medium px-3 py-1.5 rounded-full transition"
                  >
                    👁️ 預覽
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
