import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(name) {
  const code = ts.transpileModule(readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: () => ({}), Date, Math, Number, String, Object, JSON, Array, RegExp });
  return loaded.exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const stats = load('task-stats');
const TODAY = '2026-10-28';

const sample = (fields) => ({
  employee: null, period: { from: '2026-10-01', to: '2026-10-31', as_of: '', ended: false },
  total: 0, completed: 0, not_completed: 0, completion_percent: null, completed_on_time: 0, completed_late: 0,
  overdue: 0, on_track: 0, completed_in_period: 0, without_due: 0, daily: [], priorities: [], ...fields,
});

test('weeks run Monday to Sunday, months to their last day', () => {
  assert.deepEqual(plain(stats.weekPeriod(TODAY)), { kind: 'week', from: '2026-10-26', to: '2026-11-01' });
  assert.deepEqual(plain(stats.weekPeriod('2026-11-01')), { kind: 'week', from: '2026-10-26', to: '2026-11-01' });
  assert.deepEqual(plain(stats.monthPeriod('2028-02-10')), { kind: 'month', from: '2028-02-01', to: '2028-02-29' });
});

test('arrows step whole weeks and months, across the year', () => {
  assert.deepEqual(plain(stats.shiftPeriod(stats.weekPeriod(TODAY), -1)), { kind: 'week', from: '2026-10-19', to: '2026-10-25' });
  assert.deepEqual(plain(stats.shiftPeriod(stats.monthPeriod('2026-12-15'), 1)), { kind: 'month', from: '2027-01-01', to: '2027-01-31' });
  const own = stats.customPeriod('2026-10-15', '2026-10-01');
  assert.deepEqual(plain(own), { kind: 'custom', from: '2026-10-01', to: '2026-10-15' });
  assert.equal(stats.shiftPeriod(own, 1), own);
});

test('titles and phrases of the screens', () => {
  assert.equal(stats.periodTitle(stats.monthPeriod(TODAY)), 'Октябрь 2026');
  assert.equal(stats.periodTitle(stats.weekPeriod(TODAY)), '26 окт – 1 ноя');
  assert.equal(stats.periodTitle(stats.customPeriod('2026-10-01', '2026-10-15')), '1–15 октября');
  assert.equal(stats.rangeLabel(stats.monthPeriod(TODAY)), '1–31 октября');
  assert.equal(stats.periodPhrase(stats.monthPeriod(TODAY), TODAY), 'в октябре');
  assert.equal(stats.periodPhrase(stats.weekPeriod(TODAY), TODAY), 'на этой неделе');
  assert.equal(stats.periodPhrase(stats.customPeriod('2026-10-01', '2026-10-15'), TODAY), 'с 1 по 15 октября');
  assert.equal(stats.numericDate('2026-10-01'), '01.10.2026');
});

test('a period already over is counted as of its last day', () => {
  assert.equal(stats.asOfLabel(stats.monthPeriod('2026-09-10'), TODAY), 'на 30 сентября');
  assert.equal(stats.asOfLabel(stats.monthPeriod(TODAY), TODAY), 'на текущий момент');
  assert.equal(stats.asOfLabel(stats.monthPeriod('2026-11-10'), TODAY), 'на текущий момент');
});

test('screen states: nothing, nothing due, numbers (0% included)', () => {
  assert.equal(stats.statsContent(sample({})), 'empty');
  assert.equal(stats.statsContent(sample({ without_due: 6, completed_in_period: 2 })), 'noDue');
  assert.equal(stats.statsContent(sample({ total: 5, not_completed: 5, completion_percent: 0 })), 'data');
});

test('bars never divide by zero', () => {
  assert.equal(stats.share(0, 0), 0);
  assert.equal(stats.share(28, 42), 28 / 42);
  assert.equal(stats.share(5, 2), 1);
});

test('chart labels follow the week, the month and own dates', () => {
  assert.deepEqual(plain(stats.chartTicks(stats.weekPeriod(TODAY), 7)).map((t) => t.label), ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);
  assert.deepEqual(plain(stats.chartTicks(stats.monthPeriod(TODAY), 31)).map((t) => t.label), ['1', '8', '15', '22', '31']);
  assert.deepEqual(plain(stats.chartTicks(stats.monthPeriod(TODAY), 31, true)).map((t) => t.label), ['1 окт', '8', '15', '22', '31 окт']);
  assert.deepEqual(plain(stats.chartTicks(stats.customPeriod('2026-10-01', '2026-10-15'), 15, true)).map((t) => t.label), ['1 окт', '8', '15 окт']);
});

test('employee search matches the name or the position and drops empty departments', () => {
  const departments = [
    { company_id: 1, company_name: 'ТОО', department_id: 1, department_name: 'Продажи', employees: [
      { id: 1, full_name: 'Дана Сейткали', position: 'Менеджер по продажам' },
      { id: 2, full_name: 'Алия Бекова', position: 'Ассистент отдела' },
    ] },
    { company_id: 1, company_name: 'ТОО', department_id: 2, department_name: 'IT', employees: [{ id: 3, full_name: 'Руслан Омаров', position: null }] },
  ];
  assert.deepEqual(plain(stats.filterDepartments(departments, 'дана')).map((d) => d.employees.map((e) => e.id)), [[1]]);
  assert.deepEqual(plain(stats.filterDepartments(departments, 'АССИСТЕНТ')).map((d) => d.department_name), ['Продажи']);
  assert.equal(stats.filterDepartments(departments, '  '), departments);
  assert.equal(stats.initials('Айгерим Нурланова'), 'АН');
});
