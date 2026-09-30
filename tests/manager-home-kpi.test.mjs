import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateManagerHomeKpi, managerKpiRequestHrefs } from '../lib/manager-home-kpi.ts';

const now = new Date('2026-09-30T12:00:00Z');
const day = {
  totalRequests: 12,
  newRequests: 4,
  inWorkRequests: 2,
  completedRequests: 5,
  overdueRequests: 1,
  urgentRequests: 3,
  normalRequests: 9,
  plannedRequests: 0,
};

test('manager urgent and in-work KPIs use their own API fields', () => {
  const counts = calculateManagerHomeKpi([{ officeId: 1, data: { '2026-09-30': day } }], 'all', 'month', now);
  assert.deepEqual(counts, { total: 12, completed: 5, overdue: 1, emergency: 3, inWork: 2 });
  assert.notEqual(counts.inWork, counts.total - counts.completed - counts.overdue);
});

test('manager KPIs respect office and inclusive date filters and reset for empty data', () => {
  const stats = [
    { officeId: 1, data: { '2026-09-23': day, '2026-09-22': day } },
    { officeId: 2, data: { '2026-09-30': day } },
  ];
  assert.equal(calculateManagerHomeKpi(stats, '1', 'week', now).total, 12);
  assert.equal(calculateManagerHomeKpi(stats, 'all', 'week', now).total, 24);
  assert.deepEqual(calculateManagerHomeKpi([], 'all', 'month', now), {
    total: 0, completed: 0, overdue: 0, emergency: 0, inWork: 0,
  });
});

test('each KPI keeps the office and period and opens its canonical request filter', () => {
  const hrefs = managerKpiRequestHrefs('/manager', '7', 'week');
  const expected = { new: ['priority', 'urgent'], inWork: ['status', 'execution'], completed: ['status', 'completed'], overdue: ['status', 'overdue'] };
  for (const [key, [filter, value]] of Object.entries(expected)) {
    const url = new URL(hrefs[key], 'https://example.test');
    assert.equal(url.pathname, '/manager/requests');
    assert.equal(url.searchParams.get('office_id'), '7');
    assert.equal(url.searchParams.get('period'), 'week');
    assert.equal(url.searchParams.get(filter), value);
  }
  assert.equal(new URL(managerKpiRequestHrefs('/admin-worker', 'all', 'month').inWork, 'https://example.test').searchParams.has('office_id'), false);
});
