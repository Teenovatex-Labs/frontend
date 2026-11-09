import test from "node:test";
import assert from "node:assert/strict";
import { resolveHost, surfaceForHost, SURFACES } from "../src/lib/hosts.ts";

const R = (type, to, status) => (status ? { type, to, status } : { type, to });
const rows = [
  // landing
  ["teenovatex.org", "/", "", { type: "next" }],
  ["www.teenovatex.org", "/story", "", { type: "next" }],
  ["teenovatex.org", "/apply", "", { type: "next" }],
  ["teenovatex.org", "/consent/abc", "?x=1", { type: "next" }],
  ["teenovatex.org", "/home", "", R("redirect", "https://app.teenovatex.org/home", 308)],
  ["teenovatex.org", "/login", "?next=/x", R("redirect", "https://app.teenovatex.org/login?next=/x", 308)],
  ["teenovatex.org", "/dashboard/x", "", R("redirect", "https://app.teenovatex.org/home/x", 308)],
  // app
  ["app.teenovatex.org", "/", "", R("redirect", "/home", 307)],
  ["app.teenovatex.org", "/home", "", { type: "next" }],
  ["app.teenovatex.org", "/dashboard", "", R("redirect", "/home", 308)],
  ["app.teenovatex.org", "/admin/applications", "", R("redirect", "https://admin.teenovatex.org/admin/applications", 307)],
  ["app.teenovatex.org", "/tutor/classes", "", { type: "next" }], // tutor host not enabled yet
  // admin
  ["admin.teenovatex.org", "/", "", R("rewrite", "/admin")],
  ["admin.teenovatex.org", "/reports", "", R("rewrite", "/admin/reports")],
  ["admin.teenovatex.org", "/admin/applications", "", { type: "next" }],
  ["admin.teenovatex.org", "/login", "", { type: "next" }],
  ["admin.teenovatex.org", "/dashboard", "", R("redirect", "/home", 308)],
  // tutors / partners are disabled placeholders
  ["tutors.teenovatex.org", "/classes", "", { type: "next" }],
  ["partners.teenovatex.org", "/", "", { type: "next" }],
  // localhost and previews stay single-origin
  ["localhost:3000", "/", "", { type: "next" }],
  ["localhost:3000", "/admin", "", { type: "next" }],
  ["localhost:3000", "/dashboard", "", R("redirect", "/home", 308)],
  ["frontend-git-x-team.vercel.app", "/apply", "", { type: "next" }],
  ["frontend-git-x-team.vercel.app", "/home", "", { type: "next" }],
];
for (const [host, path, search, want] of rows) {
  test(`${host}${path}${search}`, () => assert.deepEqual(resolveHost(host, path, search), want));
}

test("enabling tutors routes the whole host to /tutor", () => {
  const tutor = SURFACES.find((s) => s.id === "tutor");
  tutor.enabled = true;
  try {
    assert.equal(surfaceForHost("tutors.teenovatex.org").id, "tutor");
    assert.deepEqual(resolveHost("tutors.teenovatex.org", "/classes", ""), { type: "rewrite", to: "/tutor/classes" });
    assert.deepEqual(resolveHost("app.teenovatex.org", "/tutor/classes", ""), {
      type: "redirect", to: "https://tutors.teenovatex.org/tutor/classes", status: 307,
    });
  } finally {
    tutor.enabled = false;
  }
});
