import test from 'node:test';
import assert from 'node:assert/strict';
import { CARBON_GAME_URL, PIZZA_GAME_URL, featuredGames, gameLinkProps, getGameForPackage, getGamesForPackage, isExternalGame, teachingGames, validateGames } from './teaching-games.ts';

const base = teachingGames.find(g => g.id === 'carbon');
const teacher = { ...base, id: 'shared-quiz', source: 'teacher', href: 'https://example.org/game/', image: undefined, coldStartNote: undefined, author: '王老師', addedAt: '2026-10-09' };

test('the catalog passes its own rules', () => {
  assert.deepEqual(validateGames(teachingGames), []);
});

test('moved research games link to their standalone sites', () => {
  assert.equal(teachingGames.find(g => g.id === 'pizza').href, PIZZA_GAME_URL);
  assert.equal(teachingGames.find(g => g.id === 'carbon').href, CARBON_GAME_URL);
  for (const g of teachingGames.filter(g => isExternalGame(g))) assert.ok(g.coldStartNote, g.id);
  assert.equal(getGameForPackage('1.2-III').id, 'carbon');
});

test('games still on this site keep app-relative paths so the Pages basePath applies', () => {
  for (const g of teachingGames.filter(g => !isExternalGame(g))) assert.match(g.href, /^\/missions\/[a-z-]+\/$/, g.id);
});

test('a teacher-shared game is accepted, opens in a new tab with rel=ugc, and is featured', () => {
  assert.deepEqual(validateGames([teacher]), []);
  assert.deepEqual(gameLinkProps(teacher), { target: '_blank', rel: 'ugc noopener noreferrer' });
  assert.deepEqual(gameLinkProps(base), { target: '_blank', rel: 'noopener noreferrer' });
});

test('rules reject unsafe or incomplete entries', () => {
  const bad = [
    { ...teacher, href: 'http://example.org/' },               // not https
    { ...teacher, href: 'javascript:alert(1)' },               // not a web URL
    { ...teacher, href: 'https://user:pw@example.org/' },      // credentials in URL
    { ...teacher, href: '/missions/shared-quiz/' },            // teachers cannot use on-site paths
    { ...teacher, image: 'https://example.org/x.png' },        // no remote images
    { ...teacher, author: '' },                                 // shared games need a display name
    { ...teacher, id: 'Bad ID' },
    { ...teacher, themeNumber: 7 },
    { ...teacher, levels: [] },
    { ...teacher, keyIds: ['1.2'] },
    { ...teacher, mission: 'x'.repeat(61) },
  ];
  for (const g of bad) assert.ok(validateGames([g]).length > 0, JSON.stringify({ href: g.href, id: g.id, author: g.author }));
  assert.ok(validateGames([teacher, teacher]).some(e => e.includes('重複')));
});

test('package lookups return every game and prefer the lab game for the shortcut', () => {
  assert.equal(getGamesForPackage('6.6-III').length, 1);
  assert.deepEqual(getGamesForPackage('9.9-III'), []);
  assert.equal(featuredGames().filter(g => g.source === 'lab').length, teachingGames.filter(g => g.source === 'lab').length);
});
