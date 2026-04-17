import { BHASILE_CONTACT_EMAIL } from "@/constants";

export const getErrorEmail = (
  error?: string,
  structureCodeBhasile?: string | number,
  cpomId?: number,
  operateurId?: number
): string => {
  let subject = "Problème avec le formulaire de Bhasile";
  if (structureCodeBhasile) {
    subject = `Problème avec le formulaire de Bhasile (code Bhasile ${structureCodeBhasile})`;
  }
  if (cpomId) {
    subject = `Problème avec le formulaire de CPOM (ID ${cpomId})`;
  }
  if (operateurId) {
    subject = `Problème avec le formulaire d'opérateur (ID ${operateurId})`;
  }

  const body = `Bonjour,\r\n\r\nAjoutez ici des informations supplémentaires...\r\n\r\nRapport d'erreur: ${error ?? "N/A"}`;
  return `mailto:${BHASILE_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
