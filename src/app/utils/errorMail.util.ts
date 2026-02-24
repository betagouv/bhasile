import { BHASILE_CONTACT_EMAIL } from "@/constants";

export const getErrorEmail = (
  error?: string,
  structureDnaCode?: string
): string => {
  const subject = structureDnaCode
    ? `Problème avec le formulaire de Bhasile (code DNA ${structureDnaCode})`
    : "Problème avec le formulaire de Bhasile";
  const body = `Bonjour,\r\n\r\nAjoutez ici des informations supplémentaires...\r\n\r\nRapport d'erreur: ${error ?? "N/A"}`;
  return `mailto:${BHASILE_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
