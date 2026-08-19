import { useState } from "react";

import { getPaddlePriceId, initializePaddle } from "@/lib/paddle";
import type { PriceId } from "@/lib/payments.functions";

export function usePaddleCheckout() {
  const [pending, setPending] = useState<PriceId | null>(null);

  const openCheckout = async (options: { priceId: PriceId; userId: string; email?: string }) => {
    setPending(options.priceId);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: options.email ? { email: options.email } : undefined,
        customData: { userId: options.userId },
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          allowLogout: false,
          successUrl: `${window.location.origin}/pris?checkout=success`,
        },
      });
    } finally {
      setPending(null);
    }
  };

  return { openCheckout, pending };
}
