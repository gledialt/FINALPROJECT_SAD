import { beforeEach, describe, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ updateUser: vi.fn(), resetPasswordForEmail: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
import { saveRecoveredPassword, sendRecoveryCode } from "./password-recovery";

describe("Email link recovery", () => {
  beforeEach(() => vi.resetAllMocks());
  it("sends the recovery email with a redirect to the published reset page", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await sendRecoveryCode(" person@example.com ");
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("person@example.com", {
      redirectTo: "https://smart-wasteweb.lovable.app/reset-password",
    });
  });
  it("saves a recovered password without requiring the old password", async () => {
    auth.updateUser.mockResolvedValue({ error: null });
    await saveRecoveredPassword("New-password-123");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "New-password-123" });
  });
  it("rejects a password below the minimum length", async () => {
    await expect(saveRecoveredPassword("short")).rejects.toThrow();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});
