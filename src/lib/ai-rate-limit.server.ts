import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function callerKey(): string {
  let ip: string | undefined;
  try {
    ip = getRequestIP({ xForwardedFor: true }) ?? undefined;
  } catch {
    ip = undefined;
  }
  if (!ip) {
    try {
      ip = getRequestHeader("cf-connecting-ip") ?? undefined;
    } catch {
      ip = undefined;
    }
  }
  return ip ?? "unknown";
}

function hit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  prune(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (existing.count >= limit) {
    throw new Error("RATE_LIMITED");
  }
  existing.count += 1;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Abuse guard for the paid AI endpoints. Callers are anonymous by design, so we
 * cap how many AI calls a single client (IP) can trigger per hour and per day,
 * plus a global ceiling so the AI spend can never run away.
 */
export function guardAiUsage(scope: "analyze" | "second" | "chat" | "quick") {
  const caller = callerKey();
  const perHour = scope === "chat" ? 40 : 12;
  const perDay = scope === "chat" ? 200 : 60;

  hit(`h:${scope}:${caller}`, perHour, HOUR);
  hit(`d:${caller}`, perDay, DAY);
  hit("global:hour", 3000, HOUR);
}
