import test from "node:test";
import assert from "node:assert/strict";
import {
  executorAccessCoversOffice,
  formatExecutorOfficeAccess,
  isExecutorOfficeAccessValid,
  readExecutorOfficeAccess,
  sameExecutorOfficeAccess,
  toggleExecutorOffice,
} from "../lib/executor-office-access.ts";

const offices = [
  { id: 1, name: "Савановю" },
  { id: 2, name: "Байтерек" },
  { id: 3, name: "Нурлы" },
];

test("reads the access from a user of the API and from an executor of the list", () => {
  assert.deepEqual(
    readExecutorOfficeAccess({ executor: { all_offices: false, executorOffices: [{ office_id: 3 }, { office_id: 1 }] } }, 1),
    { all_offices: false, office_ids: [1, 3] },
  );
  assert.deepEqual(readExecutorOfficeAccess({ executor: { all_offices: true, executorOffices: [] } }, 1), {
    all_offices: true,
    office_ids: [],
  });
  assert.deepEqual(readExecutorOfficeAccess({ office_access: { all_offices: false, office_ids: [2] } }), {
    all_offices: false,
    office_ids: [2],
  });
});

test("an executor without a saved choice keeps their own office", () => {
  assert.deepEqual(readExecutorOfficeAccess({ executor: { all_offices: false, executorOffices: [] } }, 2), {
    all_offices: false,
    office_ids: [2],
  });
  assert.equal(readExecutorOfficeAccess({ role: "client" }, 2), null);
});

test("toggling offices: several offices, and a single office leaves «All offices»", () => {
  let access = { all_offices: false, office_ids: [1] };
  access = toggleExecutorOffice(access, 3);
  assert.deepEqual(access, { all_offices: false, office_ids: [1, 3] });
  access = toggleExecutorOffice(access, 1);
  assert.deepEqual(access, { all_offices: false, office_ids: [3] });
  assert.deepEqual(toggleExecutorOffice({ all_offices: true, office_ids: [] }, 2), {
    all_offices: false,
    office_ids: [2],
  });
});

test("an empty choice cannot be saved", () => {
  assert.equal(isExecutorOfficeAccessValid({ all_offices: false, office_ids: [] }), false);
  assert.equal(isExecutorOfficeAccessValid({ all_offices: true, office_ids: [] }), true);
  assert.equal(isExecutorOfficeAccessValid({ all_offices: false, office_ids: [4] }), true);
});

test("compares choices regardless of order", () => {
  assert.equal(sameExecutorOfficeAccess({ all_offices: false, office_ids: [2, 1] }, { all_offices: false, office_ids: [1, 2] }), true);
  assert.equal(sameExecutorOfficeAccess({ all_offices: true, office_ids: [] }, { all_offices: false, office_ids: [1] }), false);
  assert.equal(sameExecutorOfficeAccess({ all_offices: false, office_ids: [1] }, { all_offices: false, office_ids: [1, 2] }), false);
});

test("labels the choice for the user card", () => {
  assert.equal(formatExecutorOfficeAccess({ all_offices: true, office_ids: [] }, offices), "Все офисы");
  assert.equal(formatExecutorOfficeAccess({ all_offices: false, office_ids: [2] }, offices), "Байтерек");
  assert.equal(formatExecutorOfficeAccess({ all_offices: false, office_ids: [1, 2] }, offices), "Савановю, Байтерек");
  assert.equal(formatExecutorOfficeAccess({ all_offices: false, office_ids: [1, 2, 3] }, offices), "3 офиса");
});

test("«All offices» covers offices that appear later", () => {
  assert.equal(executorAccessCoversOffice({ all_offices: true, office_ids: [] }, 99), true);
  assert.equal(executorAccessCoversOffice({ all_offices: false, office_ids: [1, 3] }, 3), true);
  assert.equal(executorAccessCoversOffice({ all_offices: false, office_ids: [1, 3] }, 2), false);
});
