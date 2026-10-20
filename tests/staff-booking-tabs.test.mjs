import test from "node:test";
import assert from "node:assert/strict";
import { getStaffBookingTabs } from "../lib/staff-booking-tabs.ts";

const values = (role) => getStaffBookingTabs(role).map((tab) => tab.value);

test("administrator and head get booking, all bookings and room management", () => {
  for (const role of ["admin-worker", "manager"]) {
    assert.deepEqual(values(role), ["book", "my-bookings", "bookings", "rooms", "analytics", "heatmap"]);
    assert.equal(getStaffBookingTabs(role).find((tab) => tab.value === "bookings").label, "Бронирования");
  }
});

test("office manager sees the bookings of their office and does not manage rooms", () => {
  assert.deepEqual(values("department-head"), ["book", "my-bookings", "bookings", "analytics", "heatmap"]);
  assert.equal(getStaffBookingTabs("department-head").find((tab) => tab.value === "bookings").label, "Бронирования офиса");
});
