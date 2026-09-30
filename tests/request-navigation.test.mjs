import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRequestsUrlWithId,
  buildRequestsListPath,
  buildMobileRequestDetailPath,
  buildRequestsUrlWithoutFilters,
  getRequestListPeriod,
} from "../lib/requestNavigation.ts";

const roles = ["client", "executor", "admin-worker", "manager", "department-head"];
const filters = "status=execution&office_id=7&period=month&priority=urgent&type=planned";
const url = (path) => new URL(path, "https://workflow.test");

test("opening and closing a desktop request retains each role's list filters", () => {
  for (const role of roles) {
    const base = `/${role}/requests`;
    const detail = url(buildRequestsUrlWithId(base, "42/2", filters));
    assert.equal(detail.pathname, base);
    assert.equal(detail.searchParams.get("requestId"), "42");
    const returned = url(buildRequestsListPath(base, detail.search));
    assert.equal(returned.pathname, base);
    assert.equal(returned.searchParams.has("requestId"), false);
    assert.deepEqual([...returned.searchParams], [...new URLSearchParams(filters)]);
  }
});

test("opening another request replaces selection without dropping encoded or repeated query values", () => {
  const detail = url(buildRequestsUrlWithId("/manager/requests", 80, "requestId=12&requestId=15&search=A%26B&tag=first&tag=second&period=all"));
  assert.deepEqual(detail.searchParams.getAll("requestId"), ["80"]);
  assert.equal(detail.searchParams.get("search"), "A&B");
  assert.deepEqual(detail.searchParams.getAll("tag"), ["first", "second"]);
  assert.equal(detail.searchParams.get("period"), "all");
});

test("mobile details, desktop canonical redirect and return preserve the same filters", () => {
  for (const role of roles) {
    const base = `/${role}/requests`;
    const mobile = url(buildMobileRequestDetailPath(base, "42/2", `${filters}&requestId=11`));
    assert.equal(mobile.pathname, `${base}/42`);
    assert.equal(mobile.searchParams.has("requestId"), false);
    const canonical = url(buildRequestsUrlWithId(base, "42", mobile.search));
    const returned = url(buildRequestsListPath(base, canonical.search));
    assert.deepEqual([...returned.searchParams], [...new URLSearchParams(filters)]);
  }
});

test("unfiltered navigation stays canonical without a dangling query marker", () => {
  assert.equal(buildRequestsListPath("/manager/requests", "requestId=42"), "/manager/requests");
  assert.equal(buildRequestsUrlWithId("/manager/requests", 42), "/manager/requests?requestId=42");
  assert.equal(buildMobileRequestDetailPath("/manager/requests", 42), "/manager/requests/42");
});

test("reset, open request, close and reload never restore the previous list filters", () => {
  for (const role of roles) {
    const base = `/${role}/requests`;
    const reset = url(buildRequestsUrlWithoutFilters(base, `${filters}&requestId=9&tab=incoming&tag=A%26B&tag=second`));
    assert.deepEqual([...reset.searchParams], [["requestId", "9"], ["tab", "incoming"], ["tag", "A&B"], ["tag", "second"]]);
    const detail = url(buildRequestsUrlWithId(base, 1, reset.search));
    const returned = url(buildRequestsListPath(base, detail.search));
    for (const key of ["status", "priority", "type", "office_id", "period"]) {
      assert.equal(returned.searchParams.has(key), false);
    }
    // The same decoder used when the manager page mounts must match the reset UI.
    assert.equal(getRequestListPeriod(returned.searchParams.get("period")), "all");
    assert.equal(returned.searchParams.get("tab"), "incoming");
  }
});

test("reset removes repeated filters and keeps an unfiltered URL canonical", () => {
  assert.equal(buildRequestsUrlWithoutFilters("/manager/requests", "period=month&period=year&status=execution&status=new"), "/manager/requests");
  assert.equal(getRequestListPeriod("month"), "month");
  assert.equal(getRequestListPeriod("week"), "week");
  assert.equal(getRequestListPeriod("year"), "year");
  assert.equal(getRequestListPeriod("unknown"), "all");
});
