import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const source = await readFile(new URL('../components/manager/home/manager-home-dashboard.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('dashboard.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = new Set(['requestsChartData', 'prepareChartData', 'resetDateFilters']);
const statements = [];

function collect(node) {
  if (ts.isVariableStatement(node) && node.declarationList.declarations.some((declaration) =>
    ts.isIdentifier(declaration.name) && names.has(declaration.name.text))) {
    statements.push(node.getText(ast));
  }
  ts.forEachChild(node, collect);
}
collect(ast);
assert.equal(statements.length, names.size, 'load the real dashboard chart calculation and calendar reset');

// Preserve declaration order: useMemo runs during render, so moving a helper
// below it must reproduce the same initialization error as the full dashboard.
const compiled = ts.transpileModule(`
  export function useChart({ stats, chartData, office, period, startDate, endDate, setStartDate, setEndDate }) {
    ${statements.join('\n')}
    return { data: requestsChartData, reset: resetDateFilters };
  }
`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
vm.runInNewContext(compiled, { module: loaded, exports: loaded.exports, useMemo: React.useMemo });

const stats = [
  { officeId: 1, data: {
    '2026-10-16': { totalRequests: 99 },
    '2026-10-15': { totalRequests: 3 },
    '2026-10-01': { totalRequests: 2 },
    '2026-09-30': { totalRequests: 99 },
  } },
  { officeId: 2, data: {
    '2026-10-01': { totalRequests: 5 },
    '2026-10-15': { totalRequests: 7 },
  } },
];
const chartData = [{ date: '2026-10-15', count: 10 }];
const startDate = new Date('2026-10-01T00:00:00Z');
const endDate = new Date('2026-10-15T00:00:00Z');

function scenario(overrides = {}) {
  const state = { stats, chartData, office: 'all', period: 'month', ...overrides };
  state.setStartDate = (date) => { state.startDate = date; };
  state.setEndDate = (date) => { state.endDate = date; };
  let current;
  function Probe() {
    current = loaded.exports.useChart(state);
    return null;
  }
  return {
    render() {
      renderToStaticMarkup(React.createElement(Probe));
      return Array.from(current.data, (row) => ({ date: row.date, count: row.count }));
    },
    reset() { current.reset(); },
  };
}

test('manager chart keeps the period data before selecting a complete calendar range', () => {
  for (const selection of [{}, { startDate }, { endDate }]) {
    assert.deepEqual(scenario(selection).render(), chartData);
  }
});

test('selecting both calendar dates renders inclusive daily totals without crashing', () => {
  assert.deepEqual(scenario({ startDate, endDate }).render(), [
    { date: '2026-10-01', count: 7 },
    { date: '2026-10-15', count: 10 },
  ]);
});

test('calendar range respects the selected office and an office without data', () => {
  assert.deepEqual(scenario({ startDate, endDate, office: '1' }).render(), [
    { date: '2026-10-01', count: 2 },
    { date: '2026-10-15', count: 3 },
  ]);
  assert.deepEqual(scenario({ startDate, endDate, office: '999' }).render(), []);
});

test('resetting a selected calendar range restores the period chart', () => {
  const chart = scenario({ startDate, endDate });
  chart.render();
  chart.reset();
  assert.deepEqual(chart.render(), chartData);
});

test('a selected range renders safely while statistics are empty', () => {
  assert.deepEqual(scenario({ stats: [], chartData: [], startDate, endDate }).render(), []);
});
