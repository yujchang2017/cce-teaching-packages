import test from 'node:test';
import assert from 'node:assert/strict';
import { CARBON_GAME_URL, PIZZA_GAME_URL, getGameForPackage, isExternalGame, teachingGames } from './teaching-games.ts';

test('pizza links to the standalone research site', () => {
  const pizza = teachingGames.find(g => g.id === 'pizza');
  assert.equal(pizza.href, PIZZA_GAME_URL);
  assert.ok(PIZZA_GAME_URL.startsWith('https://'));
  assert.equal(isExternalGame(pizza), true);
  assert.ok(pizza.coldStartNote);
  assert.equal(getGameForPackage('6.6-III'), pizza);
});

test('carbon links to the standalone research site', () => {
  const carbon = teachingGames.find(g => g.id === 'carbon');
  assert.equal(carbon.href, CARBON_GAME_URL);
  assert.ok(CARBON_GAME_URL.startsWith('https://'));
  assert.equal(isExternalGame(carbon), true);
  assert.ok(carbon.coldStartNote);
  assert.equal(getGameForPackage('1.2-III'), carbon);
});

const moved = ['pizza', 'carbon'];
test('games not yet moved stay app-relative so the Pages basePath applies', () => {
  for (const g of teachingGames.filter(g => !moved.includes(g.id))) {
    assert.equal(isExternalGame(g), false, g.id);
    assert.match(g.href, /^\/missions\/[a-z]+\/$/, g.id);
  }
});
