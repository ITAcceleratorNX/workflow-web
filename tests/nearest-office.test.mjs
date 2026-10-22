import assert from 'node:assert/strict';
import test from 'node:test';
import { findNearestOffice } from '../lib/utils.ts';

// Как в проде на 22.10.2026: координаты есть только у Teniz Towers.
const teniz = { id: 1, name: 'Teniz Towers', lat: '43.214868', lon: '76.872067' };
const venus = { id: 3, name: 'Venus, бизнес-центр', lat: null, lon: null };
const north = (meters) => 43.214868 + meters / 111_000;

test('the only office on the map is not chosen for a user who is far from it', () => {
  // Модалка заявки выбирала Teniz Towers всем, кто разрешил геолокацию, и форма сразу становилась черновиком.
  assert.equal(findNearestOffice(north(4000), 76.872067, [venus, teniz]), null);
});

test('an office within a kilometre is chosen, coordinates may come as strings', () => {
  const result = findNearestOffice(north(150), 76.872067, [venus, teniz]);
  assert.equal(result?.office, teniz);
  assert.ok(result.distance > 0.1 && result.distance < 0.2);
});

test('offices without coordinates are never chosen', () => {
  assert.equal(findNearestOffice(north(0), 76.872067, [venus]), null);
});
