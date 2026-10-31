// Envoi d'e-mails via l'API de Resend (https://resend.com).
// Pas de bibliothèque : un simple appel HTTP, côté serveur uniquement.

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// Adresse d'expédition. Sans domaine vérifié chez Resend, seule l'adresse de
// test fournie par Resend fonctionne, et uniquement vers le propriétaire du compte.
export function senderAddress(): string {
  return (process.env.MAIL_FROM_ADDRESS || "onboarding@resend.dev").trim();
}

// Le nom d'affichage vient d'un champ saisi par l'utilisateur : on retire tout
// ce qui pourrait casser l'en-tête.
export function senderName(companyName: string): string {
  const clean = companyName.replace(/[\r\n"<>\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return clean ? `${clean} via CollectFlow` : "CollectFlow";
}

export async function sendEmail(input: {
  companyName: string;
  // Nom d'expéditeur imposé (notifications envoyées par CollectFlow lui-même).
  // Sans cela, c'est « <entreprise> via CollectFlow ».
  fromName?: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  idempotencyKey: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "L'envoi d'e-mails n'est pas configuré." };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: `${input.fromName ?? senderName(input.companyName)} <${senderAddress()}>`,
        to: [input.to],
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        subject: input.subject,
        text: input.text,
      }),
      signal: controller.signal,
    });

    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (res.ok && json.id) return { ok: true, id: json.id };
    return {
      ok: false,
      error: (json.message || `Erreur ${res.status} du service d'envoi.`).slice(0, 300),
    };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return {
      ok: false,
      error: aborted ? "Le service d'envoi n'a pas répondu à temps." : "Le service d'envoi est injoignable.",
    };
  } finally {
    clearTimeout(timer);
  }
}
