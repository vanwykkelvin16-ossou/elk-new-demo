import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * Is this user an admin?
 *
 * Reads the caller's own `user_roles` row first — that path is explicitly
 * granted to `authenticated` and guarded by the "Users can view their own
 * roles" policy, so it works for every signed-in user. The `has_role` RPC is
 * kept as a fallback (it is revoked from PUBLIC/anon, so it can fail
 * depending on grants).
 */
async function checkAdmin(userId: string): Promise<boolean> {
  const { data: roleRow, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!error) return !!roleRow;

  const { data: hasRole } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  return !!hasRole;
}

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      return checkAdmin(user.id);
    },
    enabled: !!user,
    // Short cache + refetch on focus so a member promoted to admin gains
    // portal access almost immediately instead of waiting out a long cache.
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
