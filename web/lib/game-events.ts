/** One attempt is a completed experiment/round, not necessarily a passed challenge. */
export const games = {
  carbon: '1.2-III', animals: '2.5-III', heat: '3.2-III',
  water: '4.2-III', recycling: '5.2-III', pizza: '6.6-III',
} as const;
export type GameId = keyof typeof games;
export type Environment = 'local' | 'preview' | 'production';
export interface GameEvent { event: string; resource: string; meta: Record<string, unknown> }
export type Summary = Record<string, unknown>;

export function gameEnvironment(host: string, configured?: string): Environment {
  const name = host.toLowerCase();
  if (name === 'localhost' || name.endsWith('.localhost') || name === '::1' || name === '[::1]' ||
      /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(name) || !name) return 'local';
  if (configured === 'preview') return 'preview';
  return name === 'community.cce.tw' ? 'production' : 'preview';
}

// No free text, object snapshots, coordinates, names or reflection answers.
const numbers = new Set(['level','scenario','pairs','totalPairs','tries','accuracy','hints','toyErrors',
  'success','total','successRate','cost','trees','facilities','school','stream','ground','tank','pooled',
  'score','carbonBalance','nutritionBalance','areaBalance','seconds','pure','mixed','professional',
  'batchSavings','upgrades','changes','stations']);
export function cleanSummary(input: Summary): Summary {
  const out: Summary = {};
  for (const [key, value] of Object.entries(input)) {
    if (numbers.has(key) && typeof value === 'number' && Number.isFinite(value)) out[key] = Math.round(value * 1000) / 1000;
    if ((key === 'passed' || key === 'tutorial') && typeof value === 'boolean') out[key] = value;
    if (key === 'phase' && typeof value === 'string' && ['baseline','challenge','design','dismantle'].includes(String(value))) out[key] = value;
    if (key === 'topic' && typeof value === 'string' && ['combustion','fugitive','electricity'].includes(String(value))) out[key] = value;
  }
  return out;
}

export function createGameEvents(options: {
  game: GameId; environment: () => Environment; enabled: () => boolean;
  send: (event: GameEvent) => void; now?: () => number; id?: () => string;
}) {
  const now = options.now ?? (() => performance.now());
  const id = options.id ?? (() => crypto.randomUUID());
  let viewed = false, pageId = '', count = 0;
  let active: { id: string; start: number; sampled: boolean; done: boolean; meta: Summary } | null = null;
  let previous: { id: string; key: string } | null = null;
  const enabled = () => { try { return options.environment() !== 'local' && options.enabled(); } catch { return false; } };
  function send(event: string, meta: Summary) {
    if (!enabled()) return;
    try { options.send({ event, resource: games[options.game], meta: {
      ...meta, game: options.game, keyId: games[options.game], environment: options.environment(),
      schemaVersion: 1, completionScope: 'attempt', pageId,
    } }); } catch { /* Telemetry must never interrupt gameplay. */ }
  }
  function view() {
    if (viewed || !enabled()) return;
    try { pageId = id(); viewed = true; send('game_view', {}); } catch { /* unavailable crypto */ }
  }
  function start(input: Summary = {}) {
    const meta = cleanSummary(input);
    const key = JSON.stringify([meta.phase, meta.topic, meta.tutorial, meta.level, meta.scenario]);
    view();
    let attemptId = '';
    const sampled = enabled();
    try { if (sampled) attemptId = id(); } catch { /* no ID means no sample */ }
    active = { id: attemptId, start: now(), sampled: sampled && !!attemptId, done: false, meta };
    count++;
    if (active.sampled) {
      const detail = { ...meta, attempt: count, attemptId };
      if (previous?.key === key) send('game_retry', { ...detail, previousAttemptId: previous.id });
      send('game_start', detail);
      previous = { id: attemptId, key };
    } else previous = null;
  }
  function ensureStart(meta: Summary = {}) { if (!active || active.done) start(meta); }
  function complete(input: Summary = {}) {
    if (!active || active.done) return;
    active.done = true;
    if (!active.sampled) return;
    send('game_complete', { ...active.meta, ...cleanSummary(input), attempt: count, attemptId: active.id,
      durationMs: Math.max(0, Math.round(now() - active.start)) });
  }
  function consentChanged() {
    // Never reconstruct or upload activity performed before consent / during opt-out.
    if (active) active.sampled = false;
    previous = null;
    view();
  }
  return { view, start, ensureStart, complete, cancel: () => { active = null; }, consentChanged };
}
