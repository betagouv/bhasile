const OVERSEAS_TIME_ZONES: Record<string, string> = {
  "971": "America/Guadeloupe",
  "972": "America/Martinique",
  "973": "America/Cayenne",
  "974": "Indian/Reunion",
  "976": "Indian/Mayotte",
};

// Un délai se compte à l'heure de la DDETS qui reçoit, pas de celui qui regarde
export const getDepartementTimeZone = (departement: string): string =>
  OVERSEAS_TIME_ZONES[departement] ?? "Europe/Paris";

// Une date civile « AAAA-MM-JJ » se compare comme une chaîne
export const toLocalDate = (instant: Date, timeZone: string): CivilDate =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);

export const toCivilDate = (dateColumn: Date): CivilDate =>
  dateColumn.toISOString().slice(0, 10);

export const addDays = (date: CivilDate, days: number): CivilDate => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
};

export const formatCivilDate = (date: CivilDate): string =>
  date.split("-").reverse().join("/");

// Au fuseau de la structure : le serveur et le navigateur doivent afficher la même date à l'hydratation
export const formatInstantDate = (instant: Date, timeZone: string): string =>
  formatCivilDate(toLocalDate(instant, timeZone));

export type CivilDate = string;
