import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(name, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: (id) => dependencies[id], Date, Intl, Set, Map, Math, Number, String, Object, JSON, Array, RegExp });
  return loaded.exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const dateTime = load('dateTimeUtils');
const categories = load('notification-categories', { '@/lib/dateTimeUtils': dateTime });

// 13:34 in Almaty (UTC+5), as on the Figma screens.
const NOW = new Date('2026-10-22T08:34:00Z');
const at = (iso) => new Date(iso).toISOString();
const notification = (id, created_at, extra = {}) => ({
  id, title: `Уведомление ${id}`, content: `Текст ${id}`, created_at: at(created_at), is_read: false, category: 'service_requests', ...extra,
});
const item = (category, unread_count, last) => ({ category, unread_count, last_notification: last });

test('categories: the most recent first, empty ones last in the matrix order', () => {
  const ordered = categories.orderCategoriesByActivity([
    item('service_requests', 2, notification(1, '2026-10-22T06:53:00Z')),
    item('meeting_rooms', 1, notification(2, '2026-10-22T08:20:00Z', { category: 'meeting_rooms' })),
    item('tasks', 0, null),
    item('registrations', 0, null),
  ]);
  assert.deepEqual(plain(ordered.map((c) => c.category)), ['meeting_rooms', 'service_requests', 'tasks', 'registrations']);

  const allEmpty = [item('service_requests', 0, null), item('meeting_rooms', 0, null), item('tasks', 0, null)];
  assert.deepEqual(plain(categories.orderCategoriesByActivity(allEmpty).map((c) => c.category)), ['service_requests', 'meeting_rooms', 'tasks']);
});

test('desktop opens the first category with unread notifications', () => {
  const summary = [
    item('meeting_rooms', 0, notification(2, '2026-10-22T08:20:00Z')),
    item('service_requests', 2, notification(1, '2026-10-22T06:53:00Z')),
  ];
  assert.equal(categories.defaultCategory(summary), 'service_requests');
  assert.equal(categories.defaultCategory([item('tasks', 0, null)]), 'tasks');
  assert.equal(categories.defaultCategory([]), null);
});

test('history: oldest first, grouped into today, yesterday and calendar dates', () => {
  const groups = categories.groupNotificationsByDay([
    notification(5, '2026-10-22T06:53:00Z'),
    notification(4, '2026-10-22T05:12:00Z'),
    notification(3, '2026-10-21T11:40:00Z'),
    notification(2, '2026-10-20T13:22:00Z'),
    notification(1, '2026-10-20T07:00:00Z'),
    notification(1, '2026-10-20T07:00:00Z'),
  ], NOW);
  assert.deepEqual(plain(groups.map((g) => [g.label, g.items.map((n) => n.id)])), [
    ['20 октября', [1, 2]],
    ['Вчера', [3]],
    ['Сегодня', [4, 5]],
  ]);
});

test('days follow the Almaty calendar, not UTC', () => {
  // 20:30 UTC on the 21st is already the 22nd in Almaty.
  assert.equal(categories.formatDayLabel(at('2026-10-21T20:30:00Z'), NOW), 'Сегодня');
  assert.equal(categories.formatDayLabel(at('2026-10-21T18:30:00Z'), NOW), 'Вчера');
  assert.equal(categories.formatDayLabel(at('2025-10-20T08:00:00Z'), NOW), '20 октября 2025 г.');
});

test('category time: clock today, «Вчера», then a short date', () => {
  assert.equal(categories.formatCategoryTime(at('2026-10-22T08:31:00Z'), NOW), '13:31');
  assert.equal(categories.formatCategoryTime(at('2026-10-21T08:31:00Z'), NOW), 'Вчера');
  assert.equal(categories.formatCategoryTime(at('2026-10-20T00:00:00Z'), NOW).replace(/\s/g, ' '), '20 окт.');
});

test('unread labels as on the screens', () => {
  assert.equal(categories.formatUnreadLabel(1), '1 непрочитанное');
  assert.equal(categories.formatUnreadLabel(2), '2 непрочитанных');
  assert.equal(categories.formatUnreadLabel(11), '11 непрочитанных');
  assert.equal(categories.formatUnreadLabel(21), '21 непрочитанное');
  assert.equal(categories.formatBadgeCount(120), '99+');
});

test('acceptance: 2 + 1 = 3, opening one request notification leaves 1 and 2', () => {
  const opened = notification(10, '2026-10-22T06:53:00Z');
  const summary = {
    unread_count: 3,
    categories: [
      item('service_requests', 2, opened),
      item('meeting_rooms', 1, notification(11, '2026-10-22T08:20:00Z', { category: 'meeting_rooms' })),
      item('tasks', 0, null),
    ],
  };
  const after = categories.applyNotificationRead(summary, opened);
  assert.equal(after.unread_count, 2);
  assert.deepEqual(plain(after.categories.map((c) => c.unread_count)), [1, 1, 0]);
  assert.equal(after.categories[0].last_notification.is_read, true);

  // A read notification opened again changes nothing.
  assert.equal(categories.applyNotificationRead(after, { ...opened, is_read: true }), after);
  // Nothing goes below zero.
  const zero = { unread_count: 0, categories: [item('service_requests', 0, null)] };
  assert.deepEqual(plain(categories.applyNotificationRead(zero, opened)), plain(zero));
});

test('request numbers become links, the words around them stay', () => {
  assert.deepEqual(plain(categories.splitRequestNumbers('Заявка № 1230 отклонена. Причина: дублирует заявку №1229.')), [
    { type: 'text', value: 'Заявка ' },
    { type: 'request', value: '1230' },
    { type: 'text', value: ' отклонена. Причина: дублирует заявку ' },
    { type: 'request', value: '1229' },
    { type: 'text', value: '.' },
  ]);
  assert.deepEqual(plain(categories.splitRequestNumbers('Подзаявка № 12/3')), [
    { type: 'text', value: 'Подзаявка ' },
    { type: 'request', value: '12/3' },
  ]);
  assert.deepEqual(plain(categories.splitRequestNumbers('Без номера')), [{ type: 'text', value: 'Без номера' }]);
});

test('only service requests link request numbers', () => {
  assert.equal(categories.NOTIFICATION_CATEGORY_META.service_requests.linksRequests, true);
  for (const key of ['meeting_rooms', 'tasks', 'registrations']) {
    assert.equal(categories.NOTIFICATION_CATEGORY_META[key].linksRequests, false, key);
  }
  assert.equal(categories.isNotificationCategory('registrations'), true);
  assert.equal(categories.isNotificationCategory('health'), false);
});
