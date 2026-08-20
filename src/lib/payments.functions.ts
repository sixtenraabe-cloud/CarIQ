import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { EntitlementState } from "@/lib/entitlements.server";

export const PRICE_IDS = ["single_diagnosis_once", "cariq_pro_monthly"] as const;
export type PriceId = (typeof PRICE_IDS)[number];

const ResolveSchema = z.object({
  priceId: z.enum(PRICE_IDS),
  environment: z.enum(["sandbox", "live"]),
});

/** Maps our stable price ids to the Paddle price id for the given environment. */
export const resolvePaddlePrice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResolveSchema.parse(input))
  .handler(async ({ data }): Promise<string> => {
    const { gatewayFetch } = await import("./paddle.server");
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = (await response.json()) as { data?: { id: string }[] };
    const id = result.data?.[0]?.id;
    if (!id) throw new Error("Price not found");
    return id;
  });

/** Current plan, monthly analyses left and one-off credits for the signed-in user. */
export const myEntitlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EntitlementState> => {
    const { readEntitlement } = await import("./entitlements.server");
    return readEntitlement(context.userId);
  });

const CodeSchema = z.object({ code: z.string().trim().min(3).max(64) });

export type RedeemResult = { ok: boolean; reason?: "invalid" | "already" | "exhausted" };

/** Redeems an access code that grants unlimited usage to the signed-in user. */
export const redeemAccessCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CodeSchema.parse(input))
  .handler(async ({ data, context }): Promise<RedeemResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("redeem_access_code", {
      _user_id: context.userId,
      _code: data.code,
    });
    if (error) {
      console.error("redeem_access_code failed", error);
      return { ok: false, reason: "invalid" };
    }
    return (result as unknown as RedeemResult) ?? { ok: false, reason: "invalid" };
  });
