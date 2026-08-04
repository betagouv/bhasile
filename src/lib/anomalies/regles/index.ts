import type { RegleAnomalie } from "@/lib/anomalies/anomalie.regle";
import { REGLES_CALENDRIER } from "@/lib/anomalies/regles/calendrier.regle";
import { REGLES_FINANCE } from "@/lib/anomalies/regles/finance.regle";

export const REGLES_ANOMALIES: RegleAnomalie[] = [
  ...REGLES_CALENDRIER,
  ...REGLES_FINANCE,
];
