import { supabase } from "@/integrations/supabase/client";
import { accountPasswordSchema } from "./account-rules";

/** Sends the recovery email. The link in the email lands directly on /reset-password. */
export async function sendRecoveryCode(email: string) {
  // Always the public published site: preview hosts require a Lovable login.
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: "https://smart-wasteweb.lovable.app/reset-password",
  });
  if (error) throw error;
}

export async function saveRecoveredPassword(password: string) {
  accountPasswordSchema.parse(password);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
