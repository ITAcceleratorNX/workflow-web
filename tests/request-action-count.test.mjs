import test from "node:test";
import assert from "node:assert/strict";
import {
  formatRequestActionBadge,
  hasRequestActionCount,
  isRequestStateMutation,
} from "../lib/request-action-count.ts";

test("the requests badge is hidden entirely when nothing waits for the user", () => {
  for (const count of [0, -1, null, undefined, Number.NaN]) {
    assert.equal(formatRequestActionBadge(count), null, String(count));
  }
  assert.equal(formatRequestActionBadge(1), "1");
  assert.equal(formatRequestActionBadge(3), "3");
  assert.equal(formatRequestActionBadge(99), "99");
  assert.equal(formatRequestActionBadge(100), "99+", "A compact badge stays two digits wide");
});

test("the counter exists for the admin, department head, executor and client, not the platform manager", () => {
  for (const role of ["admin-worker", "department-head", "executor", "client"]) {
    assert.equal(hasRequestActionCount(role), true, role);
  }
  for (const role of ["manager", null, undefined, ""]) {
    assert.equal(hasRequestActionCount(role), false, String(role));
  }
});

test("only actions that move a request refresh the counter; opening a request does not", () => {
  const moves = [
    ["post", "/request-groups"],
    ["patch", "/request-groups/12"],
    ["patch", "/request-groups/12/take"],
    ["post", "/request-groups/bulk-delete"],
    ["delete", "/request-groups/12"],
    ["post", "/request-executors/5/assign"],
    ["put", "/request-executors/5/change"],
    ["patch", "/requests/5/execute"],
    ["patch", "/requests/5/complete"],
    ["patch", "/requests/5/admin-start"],
    ["put", "/requests/5"],
    ["post", "/ratings"],
    ["PUT", "ratings"],
    ["post", "https://api.workflow.test/api/requests/5/complete"],
  ];
  for (const [method, url] of moves) {
    assert.equal(isRequestStateMutation(method, url), true, `${method} ${url}`);
  }
  assert.equal(isRequestStateMutation("patch", "https://api.test/api/requests/5/execute", "https://api.test/api"), true);

  const stills = [
    ["get", "/request-groups/12"],
    ["get", "/request-groups/action-count"],
    ["GET", "/requests/5"],
    ["post", "/request-logs"],
    ["post", "/requestsx"],
    ["patch", "/notifications/3/read"],
    ["post", "/user-tasks"],
    [undefined, "/requests/5"],
    ["post", undefined],
  ];
  for (const [method, url] of stills) {
    assert.equal(isRequestStateMutation(method, url), false, `${method} ${url}`);
  }
});
