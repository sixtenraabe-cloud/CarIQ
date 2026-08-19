import { createFileRoute } from "@tanstack/react-router";

import { verifyWebhook, type PaddleEnv } from "@/lib/paddle.server";

const SINGLE_USE_PRICE = "single_diagnosis_once";

type Any = Record<string, any>;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Returns false when this event was already processed. */
async function claimEvent(eventId: string, eventType: string): Promise<boolean> {
  if (!eventId) return true;
  const db = await admin();
  const { error } = await db.from("payment_events").insert({ event_id: eventId, event_type: eventType });
  if (error) return false;
  return true;
}

function userIdOf(data: Any): string | null {
  const id = data?.custom_data?.userId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

async function handleTransactionCompleted(data: Any) {
  const userId = userIdOf(data);
  if (!userId) {
    console.warn("transaction.completed without custom_data.userId");
    return;
  }
  const items: Any[] = Array.isArray(data.items) ? data.items : [];
  let credits = 0;
  for (const item of items) {
    const priceId = item?.price?.import_meta?.external_id;
    if (priceId === SINGLE_USE_PRICE) credits += Number(item?.quantity ?? 1) || 1;
  }
  if (credits <= 0) return;

  const db = await admin();
  const { error } = await db.rpc("grant_credits", { _user_id: userId, _amount: credits });
  if (error) console.error("grant_credits failed", error);
}

async function upsertSubscription(data: Any, env: PaddleEnv) {
  const userId = userIdOf(data);
  if (!userId) {
    console.warn("subscription event without custom_data.userId");
    return;
  }
  const item: Any = Array.isArray(data.items) ? (data.items[0] ?? {}) : {};
  const priceId = item?.price?.import_meta?.external_id;
  const productId = item?.product?.import_meta?.external_id;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing import_meta.external_id");
    return;
  }

  const db = await admin();
  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: String(data.id),
      paddle_customer_id: String(data.customer_id ?? ""),
      product_id: productId,
      price_id: priceId,
      status: String(data.status ?? "active"),
      current_period_start: data.current_billing_period?.starts_at ?? null,
      current_period_end: data.current_billing_period?.ends_at ?? null,
      cancel_at_period_end: data.scheduled_change?.action === "cancel",
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );
  if (error) console.error("subscription upsert failed", error);
}

async function markSubscription(data: Any, env: PaddleEnv, status: string) {
  const db = await admin();
  const { error } = await db
    .from("subscriptions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", String(data.id))
    .eq("environment", env);
  if (error) console.error("subscription status update failed", error);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") === "live" ? "live" : "sandbox") as PaddleEnv;
        try {
          const event = await verifyWebhook(request, env);
          if (!(await claimEvent(event.eventId, event.eventType))) {
            return Response.json({ received: true, duplicate: true });
          }
          const data = event.data as Any;
          switch (event.eventType) {
            case "transaction.completed":
              await handleTransactionCompleted(data);
              break;
            case "subscription.created":
            case "subscription.updated":
              await upsertSubscription(data, env);
              break;
            case "subscription.canceled":
              await markSubscription(data, env, "canceled");
              break;
            default:
              console.log("Unhandled payment event:", event.eventType);
          }
          return Response.json({ received: true });
        } catch (error) {
          console.error("Payment webhook error:", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
