import test from "node:test";
import assert from "node:assert/strict";
import { ROLES, FALLBACK_PERMISSIONS, isStaff, can } from "../src/lib/roles.ts";

test("every role is listed, including tutor and partner", () => {
  assert.deepEqual([...ROLES].sort(), ["admin", "member", "mentor", "moderator", "partner", "tutor"]);
  for (const r of ROLES) assert.ok(FALLBACK_PERMISSIONS[r], `missing fallback for ${r}`);
});

test("isStaff is true only for moderator and admin", () => {
  const expected = { member: false, mentor: false, tutor: false, partner: false, moderator: true, admin: true };
  for (const r of ROLES) assert.equal(isStaff(r), expected[r], r);
  assert.equal(isStaff(undefined), false);
  assert.equal(isStaff(null), false);
  assert.equal(isStaff("superuser"), false);
});

// Fallback map (no permissions array from the API): role -> [staff.access, settings.manage, badges.award]
const table = {
  member: [false, false, false],
  mentor: [false, false, false],
  tutor: [false, false, false],
  partner: [false, false, false],
  moderator: [true, false, false],
  admin: [true, true, true],
};

test("can() falls back to the static map when the API sent no permissions", () => {
  for (const [role, [staff, settings, award]] of Object.entries(table)) {
    const user = { role };
    assert.equal(can(user, "staff.access"), staff, `${role} staff.access`);
    assert.equal(can(user, "settings.manage"), settings, `${role} settings.manage`);
    assert.equal(can(user, "badges.award"), award, `${role} badges.award`);
    assert.equal(can({ role, permissions: null }, "staff.access"), staff, `${role} null permissions`);
  }
});

test("can() trusts the API's permissions array over the role", () => {
  // The API is the source of truth, in both directions.
  assert.equal(can({ role: "member", permissions: ["reports.read"] }, "reports.read"), true);
  assert.equal(can({ role: "admin", permissions: [] }, "settings.manage"), false);
  assert.equal(can({ role: "moderator", permissions: ["staff.access"] }, "users.suspend"), false);
});

test("can() denies with no user or an unknown role", () => {
  assert.equal(can(null, "staff.access"), false);
  assert.equal(can(undefined, "staff.access"), false);
  assert.equal(can({ role: "superuser" }, "staff.access"), false);
});
