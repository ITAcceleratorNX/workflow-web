import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

// Resolve the application alias while loading the actual module in Node.
const aliases = { '@/lib/manager-period': new URL('../lib/manager-period.ts', import.meta.url).href };
const resolver = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(aliases[specifier] ?? specifier, context);
  },
});
const {
  fileNameSlug,
  formatRequestCount,
  requestExportFileName,
  requestExportMeta,
  requestExportParams,
  requestExportSummary,
  requestPeriodRange,
} = await import('../lib/request-export.ts');
resolver.deregister();

const now = new Date(2026, 9, 30, 15, 43);
const defaults = { tab: 'all', office: 'all', period: 'all', status: 'all', type: 'all' };
const applied = {
  tab: 'all', office: '7', officeName: 'Teniz Towers', period: 'month',
  status: 'execution', statusLabel: 'Исполнение', type: 'all',
};

test('the period range is the list filter rule up to now, not dates from the mockup', () => {
  assert.equal(requestPeriodRange('all', now), null);
  assert.deepEqual(requestPeriodRange('month', now), { from: new Date(2026, 8, 30), to: now });
  assert.deepEqual(requestPeriodRange('week', now), { from: new Date(now.getTime() - 7 * 24 * 3600 * 1000), to: now });
  assert.deepEqual(requestPeriodRange('year', now).from, new Date(2025, 9, 30));
});

test('the export request carries the tab and every applied filter, and nothing for «all»', () => {
  assert.deepEqual(requestExportParams(defaults, null), {});
  const range = requestPeriodRange('month', now);
  assert.deepEqual(requestExportParams({ ...applied, type: 'urgent' }, range), {
    office_id: '7',
    from: range.from.toISOString(),
    to: now.toISOString(),
    status: 'execution',
    priority: 'urgent',
  });
  // «Отклонённые»: the status comes from the tab, a stale status filter is not sent.
  assert.deepEqual(requestExportParams({ ...applied, tab: 'rejected' }, null), { tab: 'rejected', office_id: '7' });
});

test('the export window names the conditions as the mockup does', () => {
  assert.equal(
    requestExportSummary(applied, requestPeriodRange('month', now)),
    'Teniz Towers · 30 сентября – 30 октября 2026 · Исполнение · все типы',
  );
  assert.equal(requestExportSummary(defaults, null), 'Все офисы · весь период · все статусы · все типы');
  assert.equal(
    requestExportSummary({ ...defaults, tab: 'rejected', type: 'urgent', typeLabel: 'Экстренная' }, null),
    'Все офисы · весь период · Экстренная',
  );
  assert.equal(requestExportMeta(3, 'all'), '3 заявки · вкладка «Все»');
  assert.equal(requestExportMeta(21, 'rejected'), '21 заявка · вкладка «Отклонённые»');
});

test('request counts agree with the number', () => {
  assert.deepEqual(
    [0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111].map(formatRequestCount),
    ['0 заявок', '1 заявка', '2 заявки', '4 заявки', '5 заявок', '11 заявок', '12 заявок', '14 заявок',
      '21 заявка', '22 заявки', '25 заявок', '101 заявка', '111 заявок'],
  );
});

test('the file name is Latin and says the office and the period', () => {
  assert.equal(requestExportFileName(applied, requestPeriodRange('month', now), now), 'zayavki_teniz-towers_30.09–30.10.2026.xlsx');
  assert.equal(requestExportFileName(defaults, null, now), 'zayavki_30.10.2026.xlsx');
  assert.equal(
    requestExportFileName({ ...defaults, tab: 'rejected', period: 'year' }, requestPeriodRange('year', now), now),
    'zayavki_otklonennye_30.10.2025–30.10.2026.xlsx',
  );
  assert.equal(fileNameSlug('Нурлы-Тау'), 'nurly-tau');
  assert.equal(fileNameSlug('Venus, бизнес-центр'), 'venus-biznes-tsentr');
  assert.equal(fileNameSlug('Көктем-2'), 'koktem-2');
});
