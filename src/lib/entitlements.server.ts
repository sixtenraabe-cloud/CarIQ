export type EntitlementState = {
  plan: "free" | "pro";
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyLeft: number;
  credits: number;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  freeQuickLeft: number;
  left: number;
};

const EMPTY: EntitlementState = {
  plan: "free",
  monthlyLimit: 0,
  monthlyUsed: 0,
  monthlyLeft: 0,
  credits: 0,
  periodEnd: null,
  cancelAtPeriodEnd: false,
  freeQuickLeft: 0,
  left: 0,
};

export async function readEntitlement(userId: string): Promise<EntitlementState> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("entitlement_state", { _user_id: userId });
  if (error) {
    console.error("entitlement_state failed", error);
    return EMPTY;
  }
  return { ...EMPTY, ...(data as unknown as EntitlementState) };
}

/** Deducts one analysis. Throws PAYWALL when the user has nothing left. */
export async function consumeEntitlement(userId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consume_entitlement", { _user_id: userId });
  if (error) {
    console.error("consume_entitlement failed", error);
    throw new Error("PAYWALL");
  }
  const result = data as unknown as { allowed?: boolean } | null;
  if (!result?.allowed) throw new Error("PAYWALL");
}

/** Uses the one free quick check per calendar month. Returns false when it is already used. */
export async function consumeFreeQuick(userId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consume_free_quick", { _user_id: userId });
  if (error) {
    console.error("consume_free_quick failed", error);
    return false;
  }
  return Boolean((data as unknown as { allowed?: boolean } | null)?.allowed);
}
