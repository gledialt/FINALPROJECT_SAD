import { describe, expect, it } from "vitest";
import { accountPasswordSchema, canInvite, invitationSchema, residentialData } from "./account-rules";

describe("Account invitation rules", () => {
  it("accepts admin supplied passwords and rejects passwords shorter than eight characters", () => {
    expect(accountPasswordSchema.parse("Admin-set-123")).toBe("Admin-set-123");
    expect(accountPasswordSchema.safeParse("1234567").success).toBe(false);
  });
  it.each(["masyarakat", "petugas", "admin"])("allows inviting %s", (role) => {
    expect(invitationSchema.parse({ email: "person@example.com", full_name: "Nama", role }).role).toBe(role);
  });
  it("rejects unknown roles", () => {
    expect(invitationSchema.safeParse({ email: "person@example.com", full_name: "Nama", role: "superadmin" }).success).toBe(false);
  });
  it.each(["admin", "petugas"])("omits address for %s", (role) => {
    const data = invitationSchema.parse({ email: "person@example.com", full_name: "Nama", role, address: "Jalan 1", rt_rw: "01/10", kelurahan: "Airmadidi" });
    expect(residentialData(data)).toEqual({ address: null, rt_rw: null, kelurahan: null });
  });
  it("retains resident address", () => {
    const data = invitationSchema.parse({ email: "person@example.com", full_name: "Nama", role: "masyarakat", address: "Jalan 1", rt_rw: "01/10", kelurahan: "Airmadidi" });
    expect(residentialData(data)).toEqual({ address: "Jalan 1", rt_rw: "01/10", kelurahan: "Airmadidi" });
  });
  it("only active admins can invite", () => {
    expect(canInvite("admin", true)).toBe(true);
    expect(canInvite("admin", false)).toBe(false);
    expect(canInvite("petugas", true)).toBe(false);
    expect(canInvite("masyarakat", true)).toBe(false);
  });
});