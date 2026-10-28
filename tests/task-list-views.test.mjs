import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(name, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, { module: loaded, exports: loaded.exports, require: (id) => dependencies[id], Date, Intl, Set, Map, Math, Number, String, Object, JSON, Array });
  return loaded.exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const dateTime = load('dateTimeUtils');
const due = load('task-due', { '@/lib/dateTimeUtils': dateTime });
const sort = load('task-list-sort');
const grid = load('month-grid');
const reminders = load('task-reminders');
const recipientDisplay = load('task-recipient-display');
const recipientsApi = load('task-recipients-api', { '@/lib/api': {}, '@/lib/task-history': {} });
const employeeDisplay = load('employee-display');
const search = load('task-recipient-search', { '@/lib/employee-display': employeeDisplay, '@/lib/task-recipients-api': recipientsApi });
const { millisecondsUntilNextTaskDay } = load('task-day-clock', { './dateTimeUtils': dateTime });

const makeTask = (fields = {}) => ({
  id: 1, creator_id: 1, title: 'Task', completed: false, scheduled_at: null, deadline_to: null, deadline_time: null,
  priority: 'medium', reminders_disabled: false, remind_before_minutes: null, ...fields,
});

test('due line: today, tomorrow, other days and years, legacy dates, no date', () => {
  const today = '2026-10-21';
  const now = new Date('2026-10-21T06:14:00Z'); // 11:14 in Almaty
  assert.deepEqual(plain(due.dueSummary(makeTask({ scheduled_at: '2026-10-21T10:00:00Z' }), today, now)), { text: 'Сегодня · 15:00', tone: 'upcoming' });
  assert.deepEqual(plain(due.dueSummary(makeTask({ scheduled_at: '2026-10-22T04:00:00Z' }), today, now)), { text: 'Завтра · 09:00', tone: 'upcoming' });
  assert.deepEqual(plain(due.dueSummary(makeTask({ scheduled_at: '2026-09-30T12:05:00Z' }), today, now)), { text: '30 сен · 17:05', tone: 'overdue' });
  assert.equal(due.dueSummary(makeTask({ scheduled_at: '2027-05-03T04:00:00Z' }), today, now).text, '3 мая 2027 · 09:00');
  assert.deepEqual(plain(due.dueSummary(makeTask({ deadline_to: '2026-10-01' }), today, now)), { text: '1 окт', tone: 'overdue' });
  assert.equal(due.dueSummary(makeTask({ deadline_to: '2026-10-25', deadline_time: '9:30' }), today, now).text, '25 окт · 09:30');
  assert.deepEqual(plain(due.dueSummary(makeTask(), today, now)), { text: 'Без срока', tone: 'none' });
  assert.equal(due.formatDue({ dateKey: '2026-10-01', time: '17:06' }, today, ', '), '1 окт, 17:06');
});

test('a task is overdue only while it is open and its moment has passed', () => {
  const now = new Date('2026-10-21T06:14:00Z');
  assert.equal(due.isTaskOverdue(makeTask({ scheduled_at: '2026-10-21T06:13:00Z' }), now), true);
  assert.equal(due.isTaskOverdue(makeTask({ scheduled_at: '2026-10-21T06:15:00Z' }), now), false);
  assert.equal(due.isTaskOverdue(makeTask({ scheduled_at: '2026-10-01T06:00:00Z', completed: true }), now), false);
  assert.equal(due.isTaskOverdue(makeTask({ deadline_to: '2026-10-21' }), now), false, 'a legacy date counts at noon');
  assert.equal(due.isTaskOverdue(makeTask(), now), false);
});

test('a new task is due at the next 18:00 in the app time zone', () => {
  assert.deepEqual(plain(due.defaultDue('2026-10-21', new Date('2026-10-21T12:59:00Z'))), { dateKey: '2026-10-21', time: '18:00' });
  assert.deepEqual(plain(due.defaultDue('2026-10-21', new Date('2026-10-21T13:00:00Z'))), { dateKey: '2026-10-22', time: '18:00' });
  assert.equal(due.dueToScheduledAt({ dateKey: '2026-10-21', time: '18:00' }), '2026-10-21T13:00:00.000Z');
  assert.equal(due.dueToScheduledAt(null), null);
});

test('quick due chips: Friday is the next one after tomorrow', () => {
  const dates = (today) => plain(due.quickDueOptions(today)).map((option) => option.dateKey);
  assert.deepEqual(dates('2026-10-21'), ['2026-10-21', '2026-10-22', '2026-10-23', null]); // Wednesday
  assert.deepEqual(dates('2026-10-22').slice(1, 3), ['2026-10-23', '2026-10-30']); // Thursday: tomorrow is Friday
  assert.deepEqual(dates('2026-10-24').slice(1, 3), ['2026-10-25', '2026-10-30']); // Saturday
});

test('headings and counts read naturally in Russian', () => {
  assert.equal(due.formatDayHeading('2026-10-21'), 'Ср, 21 октября');
  assert.equal(due.formatDayTitle('2026-10-21'), 'Среда, 21 октября');
  assert.deepEqual([1, 2, 5, 11, 21, 22, 25, 112].map(due.pluralTasks), ['1 задача', '2 задачи', '5 задач', '11 задач', '21 задача', '22 задачи', '25 задач', '112 задач']);
  assert.deepEqual([1, 9, 21].map(due.pluralUnfinished), ['1 незавершённая', '9 незавершённых', '21 незавершённая']);
});

test('sort: a field and a direction, sent to the API; stored values from another version fall back', () => {
  assert.deepEqual(plain(sort.DEFAULT_TASK_SORT), { field: 'deadline', direction: 'asc' });
  assert.deepEqual(plain(sort.taskSortQuery({ field: 'priority', direction: 'desc' })), { sortBy: 'priority', sortDirection: 'desc' });
  assert.equal(sort.taskSortLabel({ field: 'deadline', direction: 'asc' }), 'По сроку');
  assert.deepEqual(plain(sort.parseTaskSort({ field: 'created_at', direction: 'desc' })), { field: 'created_at', direction: 'desc' });
  for (const raw of [null, 'deadline_asc', { field: 'title', direction: 'asc' }, { field: 'deadline' }]) {
    assert.deepEqual(plain(sort.parseTaskSort(raw)), plain(sort.DEFAULT_TASK_SORT), JSON.stringify(raw));
  }
});

test('sort: «Входящие», «Сегодня» and «Предстоящие» are sorted by priority, deadline or creation date; «Выполненные» keep their order', () => {
  assert.equal(sort.sortableTaskView('inbox'), 'inbox');
  assert.equal(sort.sortableTaskView('today'), 'today');
  assert.equal(sort.sortableTaskView('upcoming'), 'upcoming');
  assert.equal(sort.sortableTaskView('completed'), null);
  assert.deepEqual(plain(sort.taskSortQuery({ field: 'priority', direction: 'asc' })), { sortBy: 'priority', sortDirection: 'asc' });
  assert.equal(sort.taskSortLabel({ field: 'priority', direction: 'desc' }), 'По приоритету');
  assert.equal(sort.taskSortLabel({ field: 'created_at', direction: 'desc' }), 'По дате');
  assert.deepEqual(plain(sort.parseTaskSort({ field: 'priority', direction: 'asc' })), { field: 'priority', direction: 'asc' });
});

test('month grid: Monday first, padded weeks, ranges and month steps across years', () => {
  const weeks = grid.monthWeeks({ year: 2026, month: 9 });
  assert.equal(weeks.length, 5);
  assert.deepEqual(plain(weeks[0]).map((cell) => cell?.day ?? null), [null, null, null, 1, 2, 3, 4]);
  assert.deepEqual(plain(weeks[4]).map((cell) => cell?.day ?? null), [26, 27, 28, 29, 30, 31, null]);
  assert.equal(grid.monthWeeks({ year: 2027, month: 1 }).length, 4, 'February 2027 starts on Monday and has 28 days');
  assert.deepEqual(plain(grid.monthRange({ year: 2024, month: 1 })), { start: '2024-02-01', end: '2024-02-29' });
  assert.deepEqual(plain(grid.shiftMonth({ year: 2026, month: 11 }, 1)), { year: 2027, month: 0 });
  assert.deepEqual(plain(grid.shiftMonth({ year: 2026, month: 0 }, -1)), { year: 2025, month: 11 });
  assert.equal(grid.monthTitle({ year: 2026, month: 9 }), 'Октябрь 2026');
});

test('reminders: options map to the server fields both ways', () => {
  assert.deepEqual(plain(reminders.DEFAULT_REMINDER.fields), { reminders_disabled: false, remind_before_minutes: 30 });
  assert.equal(reminders.reminderValue({ reminders_disabled: true, remind_before_minutes: 15 }), 'off');
  assert.equal(reminders.reminderLabel({ reminders_disabled: false, remind_before_minutes: null }), 'В момент срока');
  assert.equal(reminders.reminderLabel({ reminders_disabled: false, remind_before_minutes: 120 }), 'За 2 ч');
  const custom = reminders.reminderOptionsFor({ reminders_disabled: false, remind_before_minutes: 45 });
  assert.equal(custom.at(-1).label, 'За 45 мин');
  assert.equal(reminders.reminderOptionsFor({ reminders_disabled: false, remind_before_minutes: 30 }).length, reminders.REMINDER_OPTIONS.length);
});

test('recipient line: groups and teams, the person given the task, or the author of a task given to me', () => {
  const me = 1;
  const summary = (fields) => plain(recipientDisplay.taskRecipientSummary(makeTask(fields), me));
  assert.deepEqual(summary({ assignment_type: 'department', targetDepartment: { id: 3, name: 'Отдел продаж' } }), { icon: 'group', label: 'Отдел продаж' });
  assert.deepEqual(summary({ team_id: 4, team: { id: 4, name: 'АйТи-отдел' } }), { icon: 'group', label: 'АйТи-отдел' });
  assert.deepEqual(summary({ executor_id: 5, executor: { id: 5, full_name: 'Дамир Аблахат' } }), { icon: 'person', label: 'Дамир Аблахат' });
  assert.deepEqual(summary({ creator_id: 7, creator: { id: 7, full_name: 'Айдана' }, executor_id: me, executor: { id: me, full_name: 'Я сам' } }), { icon: 'person', label: 'от Айдана' });
  assert.equal(summary({}), null);
  assert.equal(recipientDisplay.taskRecipientLabel(makeTask({ executor_id: me, executor: { id: me, full_name: 'Я сам' } }), me), 'Я');
  assert.equal(recipientDisplay.hasOtherRecipient(makeTask({ executor_id: 5, executor: { id: 5, full_name: 'Дамир' } }), me), true);
  assert.equal(recipientDisplay.hasOtherRecipient(makeTask(), me), false);
});

test('recipient search: employees by name or department, departments, teams and whole companies; never the author', () => {
  const directory = {
    my_company: {
      id: 1, name: 'Kcell', whole: true,
      departments: [{ id: 11, name: 'Отдел продаж' }, { id: 12, name: 'IT-поддержка' }],
      employees: [
        { id: 1, full_name: 'Айдана Автор', position: null, department_id: 11 },
        { id: 5, full_name: 'Айгерим Сапарова', position: 'Бухгалтер', department_id: 12 },
        { id: 6, full_name: 'Дамир Аблахат', position: null, department_id: 11 },
      ],
    },
    available_companies: [{ id: 2, name: 'Partner', whole: false, departments: [], employees: [] }],
  };
  const teams = [{ id: 40, name: 'АйТи-отдел', leader_id: 6, members: [{ id: 5 }, { id: 6 }] }];
  const find = (query, options = {}) => plain(search.searchRecipients(query, { directory, teams, currentUserId: 1, ...options }));
  const titles = (result) => Object.fromEntries(Object.entries(result).map(([key, list]) => [key, list.map((item) => item.title)]));
  assert.deepEqual(titles(find('Ай')), { users: ['Айгерим Сапарова'], departments: [], teams: ['АйТи-отдел'], companies: [] });
  assert.deepEqual(titles(find('продаж')), { users: ['Дамир Аблахат'], departments: ['Отдел продаж'], teams: [], companies: [] });
  assert.deepEqual(find('kcell').companies.map((item) => item.selection), [{ type: 'company', company: { id: 1, name: 'Kcell' } }]);
  assert.equal(find('partner').companies.length, 0, 'a company opened only partly cannot take the whole task');
  assert.equal(find('Ай', { includeTeams: false }).teams.length, 0);
  assert.equal(find('АйТи').teams[0].subtitle, '2 сотрудника');
  assert.deepEqual(find(''), { users: [], departments: [], teams: [], companies: [] });
  assert.equal(search.selectionKey(null), 'self');
  assert.equal(search.selectionKey(find('Дамир').users[0].selection), 'user:6');
});

test('a recent recipient turns into the same choice the search gives', () => {
  const option = plain(search.recentOption({
    type: 'user', user: { id: 6, full_name: 'Дамир Аблахат', position: null, department: { id: 11, name: 'Отдел продаж' } }, company: { id: 1, name: 'Kcell' },
  }));
  assert.equal(option.key, 'user:6');
  assert.equal(option.subtitle, 'Отдел продаж');
  assert.deepEqual(option.selection, { type: 'users', company: { id: 1, name: 'Kcell' }, users: [{ id: 6, full_name: 'Дамир Аблахат' }] });
  assert.deepEqual(plain(search.recentOption({ type: 'user', user: { id: 8, full_name: 'Ержан', position: null, department: null }, company: null })).selection,
    { type: 'legacy_user', user: { id: 8, full_name: 'Ержан' } });
  assert.equal(plain(search.recentOption({ type: 'team', team: { id: 40, name: 'АйТи', members_count: 5 } })).subtitle, '5 сотрудников');
});

test('day rollover is scheduled at Almaty midnight, including month/year boundaries', () => {
  for (const iso of ['2026-10-23T18:59:59.500Z', '2026-12-31T18:59:59.500Z', '2024-02-28T17:59:59.500Z']) {
    assert.equal(millisecondsUntilNextTaskDay(new Date(iso)), 500, iso);
  }
  assert.equal(millisecondsUntilNextTaskDay(new Date('2026-10-22T19:00:00Z')), 86_400_000);
});
