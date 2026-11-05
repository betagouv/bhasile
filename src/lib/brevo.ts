import { randomUUID } from "node:crypto";

const BREVO_API_URL = "https://api.brevo.com/v3";
const BREVO_TIMEOUT_MS = 10_000;

export const postToBrevo = async (
  path: string,
  body: unknown
): Promise<Response> => {
  const response = await fetch(`${BREVO_API_URL}${path}`, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(
      `Brevo a refusé ${path} (${response.status}) : ${await response.text()}`
    );
  }
  return response;
};

export const sendTemplateEmail = async ({
  to,
  templateId,
  params,
}: TemplateEmail): Promise<string> => {
  if (!process.env.BREVO_API_KEY || templateId === null) {
    return logTemplateEmail({ to, templateId, params });
  }
  const response = await postToBrevo("/smtp/email", {
    templateId,
    to: [{ email: to }],
    params,
  });
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
