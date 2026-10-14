export type AuthFailureReason =
  | "email_absent"
  | "mfa_absente"
  | "mfa_non_conforme"
  | "token_illisible"
  | "erreur_technique";

export class AuthError extends Error {
  readonly reason: AuthFailureReason;
  override readonly cause?: unknown;

  constructor(reason: AuthFailureReason, message: string, cause?: unknown) {
    super(message);
    this.name = "AuthError";
    this.reason = reason;
    this.cause = cause;
  }
}

export const ACCEPTED_ACR_VALUES = [
  "eidas0-mfa", // TODO : supprimer dans une prochaine PR et voir si ça pose problème à certains users en prod
  "eidas1-mfa",
  "eidas2",
  "eidas3",
];

const decodePayload = (token: string): Record<string, unknown> => {
  const segment = token.split(".")[1];
  if (!segment) {
    throw new AuthError("token_illisible", "segment JWT absent");
  }
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
};

export const checkAcr = (idToken?: string | null): string => {
  if (!idToken) {
    throw new AuthError(
      "mfa_absente",
      "id_token absent de la réponse ProConnect"
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = decodePayload(idToken);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError("token_illisible", "id_token non décodable", error);
  }

  const acr = payload.acr;
  if (typeof acr !== "string" || acr.length === 0) {
    throw new AuthError("mfa_absente", "claim `acr` absente de l'id_token");
  }
  if (!ACCEPTED_ACR_VALUES.includes(acr)) {
    throw new AuthError("mfa_non_conforme", `niveau ACR insuffisant : ${acr}`);
  }

  return acr;
};

export const rejectUrl = (reason: AuthFailureReason): string => {
  return `/connexion?accesRefuse=true&reason=${encodeURIComponent(reason)}`;
};
