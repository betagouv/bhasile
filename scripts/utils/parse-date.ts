export const parseDate = (value: string, context: string): Date => {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${context}: valeur vide`);
  }

  if (trimmed.length === 4) {
    return buildYearStartDate(Number(trimmed));
  }

  const isoCandidate = new Date(trimmed);
  if (!Number.isNaN(isoCandidate.getTime())) {
    return isoCandidate;
  }

  throw new Error(`${context}: format de date invalide (${value})`);
};

export const parseYear = (value: string, context: string): number => {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${context}: valeur vide`);
  }
  const year = Number(trimmed);
  if (Number.isNaN(year) || year < 1900 || year > 2100) {
    throw new Error(`${context}: format d'année invalide (${value})`);
  }
  return year;
};

// 1er janvier à 12:00:00 UTC depuis une année
// Utilise UTC pour éviter les problèmes de fuseau horaire
export const buildYearStartDate = (year: number, hour: number = 12): Date => {
  return new Date(Date.UTC(year, 0, 1, hour, 0, 0, 0));
};
