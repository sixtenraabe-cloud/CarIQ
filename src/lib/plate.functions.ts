import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { PlateLookup } from "./plate.server";

export type { PlateLookup };

const PlateSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .transform((value) => value.replace(/[\s-]/g, "").toUpperCase())
    .refine((value) => /^[A-ZÅÄÖ0-9]{2,8}$/.test(value), "Invalid plate"),
});

/**
 * Looks up a Swedish registration number and returns the vehicle basics so the
 * owner does not have to type make, model, year, fuel and gearbox by hand.
 */
export const lookupPlate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlateSchema.parse(input))
  .handler(async ({ data }): Promise<PlateLookup> => {
    const { guardAiUsage } = await import("./ai-rate-limit.server");
    guardAiUsage("plate");
    const { fetchVehicleByPlate, EMPTY_PLATE } = await import("./plate.server");
    try {
      return await fetchVehicleByPlate(data.plate);
    } catch {
      return EMPTY_PLATE;
    }
  });
