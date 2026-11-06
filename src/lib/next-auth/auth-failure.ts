export const AUTH_FAILURE_REASONS = [
  "email_absent",
  "mfa_absente",
  "mfa_non_conforme",
  "token_illisible",
  "non_autorise",
  "erreur_technique",
] as const;

export type AuthFailureReason = (typeof AUTH_FAILURE_REASONS)[number];

export type AuthAlert = {
  title: string;
  description: string;
  severity: "success" | "info" | "warning" | "error";
};

export const AUTH_FAILURE_ALERTS: Record<AuthFailureReason, AuthAlert> = {
  email_absent: {
    title: "Adresse e-mail indisponible",
    description:
      "Votre compte ProConnect n’a pas transmis d’adresse e-mail. Vérifiez votre compte, puis réessayez.",
    severity: "error",
  },
  mfa_absente: {
    title: "Double authentification requise",
    description:
      "Votre connexion ProConnect ne comporte pas le niveau de sécurité attendu. Reconnectez-vous en utilisant votre second facteur d’authentification.",
    severity: "error",
  },
  mfa_non_conforme: {
    title: "Niveau de sécurité insuffisant",
    description:
      "Le niveau d’authentification renvoyé par ProConnect n’est pas suffisant pour accéder à Bhasile.",
    severity: "error",
  },
  token_illisible: {
    title: "Réponse d’authentification illisible",
    description:
      "Nous n’avons pas pu lire la réponse de ProConnect. Réessayez ; si le problème persiste, contactez le support.",
    severity: "error",
  },
  non_autorise: {
    title: "Accès refusé",
    description:
      "L’accès à Bhasile n’est pas autorisé pour le compte ProConnect associé à l’adresse que vous avez utilisée.",
    severity: "error",
  },
  erreur_technique: {
    title: "Erreur technique",
    description:
      "Une erreur inattendue est survenue pendant la connexion. Réessayez dans quelques instants.",
    severity: "warning",
  },
};

export const NEXTAUTH_ERROR_ALERTS: Record<string, AuthAlert> = {
  Configuration: {
    title: "Service momentanément indisponible",
    description:
      "La connexion est mal configurée côté serveur. Merci de signaler ce problème au support.",
    severity: "error",
  },
  AccessDenied: {
    title: "Accès refusé",
    description: "Vous n’êtes pas autorisé·e à accéder à cette ressource.",
    severity: "error",
  },
  Verification: {
    title: "Lien invalide ou expiré",
    description: "Ce lien de vérification a expiré ou a déjà été utilisé.",
    severity: "error",
  },
  OAuthSignin: {
    title: "Connexion ProConnect impossible",
    description:
      "La connexion à ProConnect n’a pas pu démarrer. Vérifiez que les cookies sont autorisés, puis réessayez.",
    severity: "error",
  },
  OAuthCallback: {
    title: "Retour de ProConnect invalide",
    description:
      "ProConnect a renvoyé une réponse que nous n’avons pas pu traiter. Réessayez, puis contactez le support si cela se reproduit.",
    severity: "error",
  },
  OAuthAccountNotLinked: {
    title: "Compte déjà rattaché",
    description:
      "Cette adresse est déjà associée à un autre mode de connexion.",
    severity: "error",
  },
  SessionRequired: {
    title: "Session expirée",
    description: "Veuillez vous reconnecter pour continuer.",
    severity: "warning",
  },
  Default: {
    title: "Connexion impossible",
    description:
      "La connexion n’a pas pu aboutir. Réessayez dans quelques instants.",
    severity: "error",
  },
};

export const DEFAULT_AUTH_ALERT: AuthAlert = {
  title: "Accès refusé",
  description:
    "La connexion n’a pas pu aboutir. Réessayez ; si le problème persiste, contactez le support.",
  severity: "error",
};

export const isAuthFailureReason = (
  value: string | null | undefined
): value is AuthFailureReason =>
  typeof value === "string" &&
  (AUTH_FAILURE_REASONS as readonly string[]).includes(value);
