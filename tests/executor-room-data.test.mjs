import test from "node:test";
import assert from "node:assert/strict";
import { requestMatchesOffice } from "../lib/request-office.ts";

test("office grouping trusts the ID even when location text mentions another office", () => {
  const request = { office_id: 1, office: { id: 1 }, location_detail: "Алматы, офис 2" };
  assert.equal(requestMatchesOffice(request, 1), true);
  assert.equal(requestMatchesOffice(request, 2), false);
  assert.equal(requestMatchesOffice({ office: { id: 2 } }, 2), true);
  assert.equal(requestMatchesOffice({ office_id: 1, office: { id: 2 } }, 2), false);
  assert.equal(requestMatchesOffice({}, 2), false);
});
