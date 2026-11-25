import { AuthFailureReason } from "./auth-failure";

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

export const rejectUrl = (reason: AuthFailureReason): string => {
  return `/connexion?accesRefuse=true&reason=${encodeURIComponent(reason)}`;
};
