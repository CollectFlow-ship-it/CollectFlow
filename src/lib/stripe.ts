import { createHmac, timingSafeEqual } from "node:crypto";

// Appels à l'API de Stripe sans bibliothèque (comme pour Resend) : serveur uniquement.

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

type Param = string | number | boolean | null | undefined | Param[] | { [k: string]: Param };

// Stripe attend du « formulaire » imbriqué : a[b][c]=1, a[0]=x.
function flatten(value: Param, prefix: string, out: [string, string][]) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  } else if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}[${k}]` : k, out);
  } else {
    out.push([prefix, String(value)]);
  }
}

export type StripeResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function stripeRequest<T = Record<string, unknown>>(
  method: "GET" | "POST",
  path: string,
  params: { [k: string]: Param } = {},
): Promise<StripeResult<T>> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ok: false, error: "Stripe n'est pas configuré." };

  const pairs: [string, string][] = [];
  flatten(params, "", pairs);
  const body = new URLSearchParams(pairs).toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`https://api.stripe.com/v1${path}${method === "GET" && body ? `?${body}` : ""}`, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: method === "POST" ? body : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } } & T;
    if (!res.ok) {
      return { ok: false, error: json.error?.message ?? `Erreur Stripe (${res.status}).` };
    }
    return { ok: true, data: json };
  } catch {
    return { ok: false, error: "Stripe ne répond pas. Réessayez dans un instant." };
  } finally {
    clearTimeout(timer);
  }
}

// Vérifie la signature d'un message envoyé par Stripe (en-tête « Stripe-Signature »).
// Sans cela, n'importe qui pourrait se faire passer pour Stripe et activer un abonnement.
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  if (!header || !secret) return false;
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t") timestamp = v ?? "";
    if (k === "v1" && v) signatures.push(v);
  }
  const t = Number(timestamp);
  if (!Number.isFinite(t) || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected);
  return signatures.some((sig) => {
    const given = Buffer.from(sig);
    return given.length === expectedBuf.length && timingSafeEqual(given, expectedBuf);
  });
}
