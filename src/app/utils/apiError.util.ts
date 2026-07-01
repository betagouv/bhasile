export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const extractApiError = async (response: Response): Promise<string> => {
  const body = await response.json().catch(() => null);
  if (typeof body?.error === "string") {
    return body.details ? `${body.error} — ${body.details}` : body.error;
  }
  return typeof body?.message === "string"
    ? body.message
    : `Erreur serveur (${response.status})`;
};
