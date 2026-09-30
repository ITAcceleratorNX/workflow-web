import test from "node:test";
import assert from "node:assert/strict";
import { collectRequestPages, listLoadError } from "../lib/request-list-loading.ts";
import { completedAfterSla } from "../lib/request-overdue.ts";
import { validateAnalyticsDownload } from "../lib/analytics-download-validation.ts";

test("filters can find a request beyond the first page in a complete 25-record snapshot", async () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({ id: index + 1, type: index === 23 ? "urgent" : "normal" }));
  const calls = [];
  const result = await collectRequestPages(async (page) => {
    calls.push(page);
    return { requests: rows.slice((page - 1) * 10, page * 10), totalPages: 3 };
  });
  assert.deepEqual(calls, [1, 2, 3]);
  assert.equal(result.length, 25);
  assert.deepEqual(result.filter((row) => row.type === "urgent").map((row) => row.id), [24]);
  assert.equal(result.slice(20, 30).at(-1).id, 25);
});

test("a later-page failure rejects the snapshot instead of publishing a misleading partial list", async () => {
  await assert.rejects(collectRequestPages(async (page) => {
    if (page === 2) throw new Error("offline");
    return { requests: [{ id: 1 }], totalPages: 3 };
  }), /offline/);
});

test("duplicate pages cannot create an infinite load-more loop", async () => {
  await assert.rejects(collectRequestPages(async () => ({ requests: [{ id: 1 }], totalPages: 10 })), /все заявки/);
});

test("handles empty data and inflated join counts without fabricated records", async () => {
  assert.deepEqual(await collectRequestPages(async () => ({ requests: [], totalPages: 0 })), []);
  const rows = await collectRequestPages(async (page) => ({ requests: page === 1 ? [{ id: 1 }] : [], totalPages: 4 }));
  assert.deepEqual(rows, [{ id: 1 }]);
});

test("overdue is completed after SLA, not a nonexistent request status", () => {
  const group = { status: "completed", date_submitted: "2026-09-01T10:00:00Z", requests: [{ sla: "1h", actual_completion_date: "2026-09-01T11:00:01Z" }] };
  assert.equal(completedAfterSla(group), true);
  assert.equal(completedAfterSla({ ...group, status: "execution" }), false);
  assert.equal(completedAfterSla({ ...group, requests: [{ sla: "1h", actual_completion_date: "2026-09-01T11:00:00Z" }] }), false);
  assert.equal(completedAfterSla({ ...group, date_submitted: undefined }), false);
});

test("calendar SLA clamps month ends and leap days like the backend interval", () => {
  assert.equal(completedAfterSla({ status: "completed", date_submitted: "2024-01-31T10:00:00Z", requests: [{ sla: "1m", actual_completion_date: "2024-02-29T10:00:01Z" }] }), true);
  assert.equal(completedAfterSla({ status: "completed", date_submitted: "2024-02-29T10:00:00Z", requests: [{ sla: "1y", actual_completion_date: "2025-02-28T10:00:00Z" }] }), false);
});

test("errors distinguish forbidden, missing resources and server unavailability", () => {
  assert.match(listLoadError({ response: { status: 403 } }), /Нет доступа/);
  assert.match(listLoadError({ response: { status: 404 } }), /недоступны/);
  assert.match(listLoadError({ response: { status: 500 } }), /временно недоступен/);
});

test("exports reject HTTP errors, JSON/HTML bodies and empty files", () => {
  for (const [status, size, mime] of [[403, 100, "application/octet-stream"], [200, 100, "application/json"], [200, 100, "text/html"], [204, 0, "application/octet-stream"]]) {
    assert.throws(() => validateAnalyticsDownload(status, size, mime));
  }
  assert.doesNotThrow(() => validateAnalyticsDownload(200, 1024, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
});
