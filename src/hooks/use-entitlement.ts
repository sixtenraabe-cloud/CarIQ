import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { myEntitlement } from "@/lib/payments.functions";
import { useAuth } from "@/hooks/use-auth";

export function useEntitlement() {
  const { user } = useAuth();
  const load = useServerFn(myEntitlement);

  const query = useQuery({
    queryKey: ["entitlement", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: () => load({ data: undefined as never }),
    staleTime: 30_000,
  });

  return { entitlement: query.data ?? null, loading: query.isLoading, refetch: query.refetch, signedIn: Boolean(user) };
}
