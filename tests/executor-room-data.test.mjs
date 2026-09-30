import test from "node:test";
import assert from "node:assert/strict";
import { parseBookedHourSlots, bookingHourStart } from "../lib/meeting-room-availability.ts";
import { requestMatchesOffice } from "../lib/request-office.ts";

test("API UTC timestamps block the Kazakhstan booking hour, not the UTC hour", () => {
  const result = parseBookedHourSlots("2026-09-30", [{
    start_time: "2026-09-30T04:00:00.000Z",
    end_time: "2026-09-30T05:00:00.000Z",
  }]);
  assert.deepEqual([...result], ["09:00"]);
  assert.equal(bookingHourStart("2026-09-30", "09:00"), Date.parse("2026-09-30T04:00:00Z"));
});

test("Date objects and ISO strings yield identical booked slots", () => {
  const start_time = "2026-09-30T09:00:00+05:00";
  const end_time = "2026-09-30T11:00:00+05:00";
  const fromStrings = parseBookedHourSlots("2026-09-30", [{ start_time, end_time }]);
  const fromDates = parseBookedHourSlots("2026-09-30", [{ start_time: new Date(start_time), end_time: new Date(end_time) }]);
  assert.deepEqual(fromDates, fromStrings);
  assert.deepEqual([...fromDates], ["09:00", "10:00"]);
});

test("partial-hour bookings block both overlapping hour-long reservations", () => {
  assert.deepEqual([...parseBookedHourSlots("2026-09-30", [{
    start_time: "2026-09-30T10:30:00+05:00",
    end_time: "2026-09-30T11:15:00+05:00",
  }])], ["10:00", "11:00"]);
});

test("bookings crossing midnight block only their overlapping part of the selected day", () => {
  assert.deepEqual([...parseBookedHourSlots("2026-09-30", [
    { start_time: "2026-09-29T23:30:00+05:00", end_time: "2026-09-30T00:30:00+05:00" },
    { start_time: "2026-09-30T23:30:00+05:00", end_time: "2026-10-01T00:30:00+05:00" },
  ])], ["00:00", "23:00"]);
});

test("availability blocks include inactive rooms, while adjacent free slots remain available", () => {
  assert.deepEqual([...parseBookedHourSlots("2026-09-30", [], [
    { start_time: "2026-09-30T09:00:00+05:00", end_time: "2026-09-30T10:00:00+05:00", is_available: false },
    { start_time: "2026-09-30T10:00:00+05:00", end_time: "2026-09-30T11:00:00+05:00", is_available: true },
  ])], ["09:00"]);
});

test("invalid time intervals fail instead of reporting that the room is free", () => {
  assert.throws(() => parseBookedHourSlots("2026-09-30", [{ start_time: "bad", end_time: "bad" }]));
  assert.throws(() => parseBookedHourSlots("2026-09-30", [{ start_time: "2026-09-30T10:00:00Z", end_time: "2026-09-30T09:00:00Z" }]));
});

test("office grouping trusts the ID even when location text mentions another office", () => {
  const request = { office_id: 1, office: { id: 1 }, location_detail: "Алматы, офис 2" };
  assert.equal(requestMatchesOffice(request, 1), true);
  assert.equal(requestMatchesOffice(request, 2), false);
  assert.equal(requestMatchesOffice({ office: { id: 2 } }, 2), true);
  assert.equal(requestMatchesOffice({ office_id: 1, office: { id: 2 } }, 2), false);
  assert.equal(requestMatchesOffice({}, 2), false);
});
