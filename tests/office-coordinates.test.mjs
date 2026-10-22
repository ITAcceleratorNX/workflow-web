import assert from 'node:assert/strict';
import test from 'node:test';
import {
  coordinatesMapUrl,
  hasOfficeCoordinates,
  officeCoordinatesInput,
  parseOfficeCoordinates,
  splitCoordinatesPair,
} from '../lib/office-management-utils.ts';

test('a point copied from Google Maps or 2GIS fills both fields at once', () => {
  assert.deepEqual(splitCoordinatesPair('43.214868, 76.872067'), { lat: '43.214868', lon: '76.872067' });
  assert.deepEqual(splitCoordinatesPair(' 43.2149 76.8721 '), { lat: '43.2149', lon: '76.8721' });
  // Десятичная запятая в одном поле — не пара.
  assert.equal(splitCoordinatesPair('43,2'), null);
  assert.equal(splitCoordinatesPair('43.2149'), null);
});

test('coordinates are saved as numbers and only as a pair', () => {
  assert.deepEqual(parseOfficeCoordinates({ lat: '43,214868', lon: ' 76.872067 ' }), { ok: true, lat: 43.214868, lon: 76.872067 });
  assert.deepEqual(parseOfficeCoordinates({ lat: '', lon: '' }), { ok: true, lat: null, lon: null });
  assert.deepEqual(parseOfficeCoordinates({ lat: '43.2', lon: '' }), {
    ok: false,
    error: 'Укажите широту и долготу вместе или очистите обе',
  });
  assert.deepEqual(parseOfficeCoordinates({ lat: '143.2', lon: '76.9' }), { ok: false, error: 'Широта — число от −90 до 90' });
  assert.deepEqual(parseOfficeCoordinates({ lat: '43.2', lon: 'Алматы' }), { ok: false, error: 'Долгота — число от −180 до 180' });
});

test('an office from the API shows its coordinates or their absence', () => {
  // NUMERIC приходит из API строкой.
  assert.deepEqual(officeCoordinatesInput({ lat: '43.214868', lon: '76.872067' }), { lat: '43.214868', lon: '76.872067' });
  assert.deepEqual(officeCoordinatesInput({ lat: null }), { lat: '', lon: '' });
  assert.equal(hasOfficeCoordinates({ lat: '43.2', lon: '76.9' }), true);
  assert.equal(hasOfficeCoordinates({ lat: null, lon: null }), false);
  assert.match(coordinatesMapUrl(43.2, 76.9), /query=43\.2,76\.9$/);
});
