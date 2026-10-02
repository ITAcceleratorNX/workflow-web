import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getBlocksFromCatalog,
  getFloorZonesForBlock,
  getRoomsForFloorZone,
  hasFloorZonesForBlock,
  hasRoomsForFloorZone,
} from '../lib/office-location-catalog-utils.ts';

const row = (id, block, floor_zone, room, is_active = true) => ({
  id, office_id: 42, block, floor_zone, room, is_active,
});

test('catalog supports custom office blocks and hides inactive options at every level', () => {
  const rows = [
    row(1, 'Новый корпус', '7 этаж', '701'),
    row(2, 'Новый корпус', '7 этаж', '702'),
    row(3, 'Новый корпус', '7 этаж', '701'),
    row(4, 'Новый корпус', '7 этаж', '703', false),
    row(5, 'Новый корпус', '8 этаж', '801', false),
    row(6, 'Закрытый корпус', '1 этаж', '101', false),
  ];

  assert.deepEqual(getBlocksFromCatalog(rows), ['Новый корпус']);
  assert.deepEqual(getFloorZonesForBlock(rows, 'Новый корпус'), ['7 этаж']);
  assert.deepEqual(getRoomsForFloorZone(rows, 'Новый корпус', '7 этаж'), ['701', '702']);
  assert.equal(hasFloorZonesForBlock(rows, 'Новый корпус'), true);
  assert.equal(hasFloorZonesForBlock(rows, 'Закрытый корпус'), false);
  assert.equal(hasRoomsForFloorZone(rows, 'Новый корпус', '8 этаж'), false);
});

test('rooms directly under a block remain selectable without a floor selection', () => {
  const rows = [
    row(1, 'Склад', '', 'Приёмная'),
    row(2, 'Склад', '', 'Архив'),
    row(3, 'Склад', 'Подвал', 'Подсобная', false),
  ];

  assert.equal(hasFloorZonesForBlock(rows, 'Склад'), false);
  assert.deepEqual(getFloorZonesForBlock(rows, 'Склад'), []);
  assert.equal(hasRoomsForFloorZone(rows, 'Склад', ''), true);
  assert.deepEqual(getRoomsForFloorZone(rows, 'Склад', ''), ['Приёмная', 'Архив']);
});

test('a custom location does not require rooms belonging to another floor or block', () => {
  const rows = [
    row(1, 'А', '1 этаж', '101'),
    row(2, 'А', '2 этаж', ''),
    row(3, 'Б', '', 'Приёмная'),
  ];

  // The form uses an empty floor zone for «Другое» and checks this before listing rooms.
  assert.equal(hasRoomsForFloorZone(rows, 'А', ''), false);
  assert.equal(hasRoomsForFloorZone(rows, 'А', '2 этаж'), false);
  assert.equal(hasRoomsForFloorZone(rows, 'А', '1 этаж'), true);
  assert.deepEqual(getRoomsForFloorZone(rows, 'А', '1 этаж'), ['101']);
});
