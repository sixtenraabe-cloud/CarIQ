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
