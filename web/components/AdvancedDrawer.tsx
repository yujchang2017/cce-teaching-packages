import type { TeachingPackage } from '@/lib/types';

export default function AdvancedDrawer({ pkg }: { pkg: TeachingPackage }) {
  const githubUrl = `https://github.com/yujchang2017/cce-teaching-packages/tree/main/packages/level-${pkg.level.toLowerCase()}/${pkg.keyId}`;
  const cloneCmd = 'git clone https://github.com/yujchang2017/cce-teaching-packages.git';

  const metadata = {
    key_id: pkg.keyId,
    topic: pkg.topicEn,
    level: pkg.level,
    age_range: [9, 12],
    sessions: 4,
    duration_per_session_min: 40,
    learning_objectives: {
      cognitive: pkg.learningOutcomes.cognitive.map((lo) => lo.split(' ')[0]),
      social: pkg.learningOutcomes.social.map((lo) => lo.split(' ')[0]),
      behavioural: pkg.learningOutcomes.behavioural.map((lo) => lo.split(' ')[0]),
    },
    files: ['data_card.json', 'lesson_plan.md', 'ppt_script.md', 'worksheet.html'],
    license: 'CC BY-SA 4.0',
    forks: pkg.forks,
    stars: pkg.stars,
  };

  return (
    <section className="mb-10">
      <details className="bg-white rounded-2xl shadow-warm border border-earth/10 group">
        <summary className="cursor-pointer p-5 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <div className="font-bold text-ink">
                進階：技術細節{' '}
                <span className="text-xs font-normal text-mute">（給熟 GitHub 的老師）</span>
              </div>
              <div className="text-xs text-mute mt-0.5">原始檔、git 指令、JSON metadata</div>
            </div>
          </div>
          <span className="chev text-earth text-xl">▸</span>
        </summary>
        <div className="px-5 pb-5 pt-0 border-t border-earth/10 space-y-4">
          {/* GitHub link */}
          <div className="pt-4">
            <div className="text-xs font-bold text-earth tracking-wider uppercase mb-1.5">
              📁 直接看 GitHub 原始檔
            </div>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-forest hover:underline break-all"
            >
              {githubUrl.replace('https://', '')}
              <span className="text-xs">↗</span>
            </a>
          </div>

          {/* git clone */}
          <div>
            <div className="text-xs font-bold text-earth tracking-wider uppercase mb-1.5">
              🔗 複製 git clone 指令
            </div>
            <div className="flex items-center gap-2 bg-ink text-cream rounded-lg p-3 font-mono text-sm">
              <code className="flex-1 overflow-x-auto whitespace-nowrap">{cloneCmd}</code>
              <button
                type="button"
                className="text-xs bg-sun hover:bg-sunDeep text-white px-3 py-1 rounded transition shrink-0"
              >
                複製
              </button>
            </div>
          </div>

          {/* API / metadata */}
          <div>
            <div className="text-xs font-bold text-earth tracking-wider uppercase mb-1.5">
              📊 API / Metadata（JSON）
            </div>
            <pre className="bg-sand/50 rounded-lg p-3 text-xs text-ink overflow-x-auto border border-earth/10">
              <code>{JSON.stringify(metadata, null, 2)}</code>
            </pre>
          </div>
        </div>
      </details>
    </section>
  );
}
