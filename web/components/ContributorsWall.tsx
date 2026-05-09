import type { Contributor } from '@/lib/types';

export default function ContributorsWall({ contributors }: { contributors: Contributor[] }) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-warm mb-10">
      <h3 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
        🎓 參與本教案改編的老師{' '}
        <span className="text-mute font-normal text-sm">({contributors.length} 位)</span>
      </h3>
      <div className="flex items-center gap-3 flex-wrap">
        {contributors.map((c) => (
          <div key={c.name} className="avatar-wrap">
            <div
              className="avatar"
              style={{
                background: `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientTo})`,
              }}
            >
              {c.initial}
            </div>
            <div className="tip">
              {c.name} · {c.school}
            </div>
          </div>
        ))}
        <div className="w-px h-10 bg-earth/15 mx-2" />
        <a href="#" className="text-sm text-sun hover:text-sunDeep hover:underline">
          查看所有貢獻者 →
        </a>
      </div>
    </section>
  );
}
