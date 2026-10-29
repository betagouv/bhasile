const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_TIMEOUT_MS = 10_000;

export const isBrevoConfigured = (): boolean =>
  Boolean(process.env.BREVO_API_KEY);

export const sendTemplateEmail = async ({
  to,
  templateId,
  params,
}: TemplateEmail): Promise<string> => {
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

type TemplateEmail = {
  to: string;
  templateId: number;
  params: Record<string, unknown>;
};
