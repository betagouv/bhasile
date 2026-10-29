import { randomUUID } from "node:crypto";

const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_TIMEOUT_MS = 10_000;

export const sendTemplateEmail = async ({
  to,
  templateId,
  params,
}: TemplateEmail): Promise<string> => {
  if (!process.env.BREVO_API_KEY || templateId === null) {
    return logTemplateEmail({ to, templateId, params });
  }
  const response = await fetch(BREVO_SEND_EMAIL_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      templateId,
      to: [{ email: to }],
      params,
    }),
    signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(
      `Envoi Brevo refusé (${response.status}) : ${await response.text()}`
    );
  }
  const { messageId } = (await response.json()) as { messageId: string };
  return messageId;
};

// Hors prod, une configuration incomplète journalise le mail : tout le chemin (regroupement, trace, reprise) s'exécute
const logTemplateEmail = (email: TemplateEmail): string => {
  if (process.env.IS_PRODUCTION === "true") {
    throw new Error(
      "Envoi Brevo impossible : BREVO_API_KEY ou identifiant du template manquant"
    );
  }
  console.log("✉️ Mail journalisé, non envoyé :", JSON.stringify(email));
  return `log-${randomUUID()}`;
};

type TemplateEmail = {
  to: string;
  templateId: number | null;
  params: Record<string, unknown>;
};
