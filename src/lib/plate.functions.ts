import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { lookupPlateData, type PlateLookup } from "./plate.server";

export const lookupPlate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      plate: z
        .string()
        .trim()
        .min(2)
        .max(10)
        .transform((value) => value.replace(/[\s-]/g, "").toUpperCase())
        .refine((value) => /^[A-ZÅÄÖ0-9]{2,8}$/.test(value), "Invalid plate"),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<PlateLookup> => {
    const { guardPlateUsage } = await import("./ai-rate-limit.server");
    if (!guardPlateUsage()) {
      return {
        found: false,
        make: "",
        model: "",
        variant: "",
        year: null,
        fuel: "",
        transmission: "",
        inspectionKm: null,
        inspectionDate: "",
      };
    }
    return lookupPlateData(data.plate);
  });