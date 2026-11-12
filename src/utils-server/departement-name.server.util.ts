// Typos connus dans les noms de départements connues dans les fichiers source externes
const KNOWN_DEPARTEMENT_NAME_TYPOS: Record<string, string> = {
  "alpes-de-hautes-provence": "Alpes-de-Haute-Provence",
  "seine-st-denis": "Seine-Saint-Denis",
};

export function normalizeDepartementName(
  value: string | null | undefined
): string {
  const departementName = value?.trim() ?? "";
  return (
    KNOWN_DEPARTEMENT_NAME_TYPOS[departementName.toLowerCase()] ??
    departementName
  );
}
