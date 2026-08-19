import { createHmac, timingSafeEqual } from "crypto";

export type PaddleEnv = "sandbox" | "live";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/paddle";

function connectionKey(env: PaddleEnv): string {
  const key = env === "live" ? process.env["PADDLE_LIVE_API_KEY"] : process.env["PADDLE_SANDBOX_API_KEY"];
  if (!key) throw new Error(`Missing Paddle connection key for ${env}`);
  return key;
}

/** Calls the Paddle API through the Lovable connector gateway. */
export async function gatewayFetch(env: PaddleEnv, path: string, init?: RequestInit): Promise<Response> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");

  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey(env),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Paddle gateway failed [${response.status}]: ${body}`);
    throw new Error(`Paddle request failed [${response.status}]: ${body}`);
  }
  return response;
}

export type PaddleEvent = {
  eventId: string;
  eventType: string;
  data: Record<string, unknown>;
};

function webhookSecret(env: PaddleEnv): string {
  const secret =
    env === "live" ? process.env["PAYMENTS_LIVE_WEBHOOK_SECRET"] : process.env["PAYMENTS_SANDBOX_WEBHOOK_SECRET"];
  if (!secret) throw new Error(`Missing Paddle webhook secret for ${env}`);
  return secret;
}

/**
 * Verifies Paddle's `Paddle-Signature` header (ts=<unix>;h1=<hmac sha256 of
 * "<ts>:<raw body>">) before any event is trusted. Throws on any mismatch.
 */
export async function verifyWebhook(request: Request, env: PaddleEnv): Promise<PaddleEvent> {
  const header = request.headers.get("paddle-signature");
  if (!header) throw new Error("Missing Paddle-Signature header");

  const parts = Object.fromEntries(
    header
      .split(";")
      .map((piece) => piece.split("="))
      .filter((pair): pair is [string, string] => pair.length === 2),
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) throw new Error("Malformed Paddle-Signature header");

  // Reject replays older than 5 minutes.
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) throw new Error("Stale Paddle signature");

  const raw = await request.text();
  const expected = createHmac("sha256", webhookSecret(env)).update(`${ts}:${raw}`).digest("hex");
  const given = Buffer.from(h1, "hex");
  const mine = Buffer.from(expected, "hex");
  if (given.length !== mine.length || !timingSafeEqual(given, mine)) {
    throw new Error("Invalid Paddle signature");
  }

  const payload = JSON.parse(raw) as { event_id?: string; event_type?: string; data?: Record<string, unknown> };
  return {
    eventId: String(payload.event_id ?? ""),
    eventType: String(payload.event_type ?? ""),
    data: payload.data ?? {},
  };
}
