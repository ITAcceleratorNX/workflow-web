import test from "node:test";
import assert from "node:assert/strict";
import {
  canRateWork,
  canClientRespond,
  canConfirmWork,
  canDeleteRequests,
  canRejectRequest,
  clientConfirmationDeadline,
  isRejectedRequest,
} from "../lib/request-permissions.ts";

const ROLES = ["client", "executor", "department-head", "admin-worker", "manager"];

test("only the platform manager deletes requests", () => {
  for (const role of ROLES) {
    assert.equal(canDeleteRequests(role), role === "manager", role);
  }
  assert.equal(canDeleteRequests(null), false);
  assert.equal(canDeleteRequests(undefined), false);
});

test("only the admin rejects, and only a new request before its first approval", () => {
  const fresh = { status: "in_progress", taken_by_admin_id: null };
  for (const role of ROLES) {
    assert.equal(canRejectRequest(role, fresh), role === "admin-worker", role);
  }
  for (const status of ["awaiting_assignment", "assigned", "execution", "completed", "rejected"]) {
    assert.equal(canRejectRequest("admin-worker", { status }), false, status);
  }
  assert.equal(
    canRejectRequest("admin-worker", { status: "in_progress", taken_by_admin_id: 7 }),
    false,
    "A request the admin took into work is no longer new",
  );
});

test("the rejected tab shows rejected requests only", () => {
  assert.equal(isRejectedRequest({ status: "rejected" }), true);
  for (const status of ["in_progress", "completed", "execution"]) {
    assert.equal(isRejectedRequest({ status }), false, status);
  }
});

test("the admin confirms the work only while it is «На проверке»", () => {
  const review = { status: "awaiting_admin_review" };
  for (const role of ROLES) {
    assert.equal(canConfirmWork(role, review), role === "admin-worker", role);
  }
  for (const status of ["execution", "awaiting_confirmation", "completed"]) {
    assert.equal(canConfirmWork("admin-worker", { status }), false, status);
  }
});

test("only the author answers a request awaiting confirmation; rating comes after closing", () => {
  const waiting = { status: "awaiting_confirmation", client_id: 5 };
  assert.equal(canClientRespond(5, waiting), true);
  assert.equal(canClientRespond(6, waiting), false, "Nobody closes it for the client");
  assert.equal(canClientRespond(null, waiting), false);
  assert.equal(canClientRespond(5, { ...waiting, status: "completed" }), false, "Nothing after closing");
  assert.equal(canClientRespond(5, { ...waiting, status: "execution" }), false);
  assert.equal(canRateWork({ status: "awaiting_confirmation" }), false);
  assert.equal(canRateWork({ status: "completed" }), true);
});

test("the client has 24 hours from the handover", () => {
  const deadline = clientConfirmationDeadline({ status: "awaiting_confirmation", confirmation_requested_at: "2026-10-19T10:00:00.000Z" });
  assert.equal(deadline.toISOString(), "2026-10-20T10:00:00.000Z");
  assert.equal(clientConfirmationDeadline({ status: "completed", confirmation_requested_at: "2026-10-19T10:00:00.000Z" }), null);
  assert.equal(clientConfirmationDeadline({ status: "awaiting_confirmation", confirmation_requested_at: null }), null);
});
