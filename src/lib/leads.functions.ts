import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Schema = z.object({
  partner: z.enum(["mekonomen", "mekanum", "other"]),
  carSummary: z.string().trim().max(200).default(""),
  verdict: z.string().trim().max(20).default(""),
  headline: z.string().trim().max(200).default(""),
  symptom: z.string().trim().max(2000).default(""),
  estimatedCost: z.string().trim().max(120).default(""),
  contactName: z.string().trim().min(2).max(80),
  contactPhone: z.string().trim().min(5).max(30),
  contactEmail: z.string().trim().max(120).default(""),
  location: z.string().trim().max(80).default(""),
  note: z.string().trim().max(500).default(""),
  consent: z.literal(true),
});

export const createWorkshopLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Schema.parse(data))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("workshop_leads")
      .insert({
        user_id: context.userId,
        partner: data.partner,
        car_summary: data.carSummary,
        verdict: data.verdict,
        headline: data.headline,
        symptom: data.symptom,
        estimated_cost: data.estimatedCost,
        contact_name: data.contactName,
        contact_phone: data.contactPhone,
        contact_email: data.contactEmail,
        location: data.location,
        note: data.note,
        consent: true,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row?.id as string };
  });
