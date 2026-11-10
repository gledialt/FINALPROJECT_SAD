import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  petugas: "Petugas Kebersihan",
  masyarakat: "Masyarakat",
};

export const ROLE_THEME: Record<AppRole, string> = {
  admin: "theme-admin",
  petugas: "theme-officer",
  masyarakat: "theme-community",
};

/** Role always comes from the database (user_roles), never from client choice. */
export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const [{ data: profile }, { data: role }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
      supabase.rpc("get_my_role"),
    ]);
    return {
      id: u.user.id,
      email: u.user.email ?? "",
      profile: profile as Profile | null,
      role: (role ?? "masyarakat") as AppRole,
    };
  },
  staleTime: 60_000,
});

export function useMe() {
  return useQuery(meQuery);
}

export function firstName(name?: string | null) {
  return (name ?? "").trim().split(/\s+/)[0] || "Pengguna";
}
