import type { RegleAnomalie } from "@/lib/anomalies/anomalie.regle";
import { REGLES_ACTIVITE } from "@/lib/anomalies/regles/activite.regle";
import { REGLES_CALENDRIER } from "@/lib/anomalies/regles/calendrier.regle";
import { REGLES_CARACTERISTIQUES } from "@/lib/anomalies/regles/caracteristiques.regle";
import { REGLES_DOCUMENTS } from "@/lib/anomalies/regles/documents.regle";
import { REGLES_FINANCE } from "@/lib/anomalies/regles/finance.regle";
import { REGLES_PLACES } from "@/lib/anomalies/regles/places.regle";

export const REGLES_ANOMALIES: RegleAnomalie[] = [
  ...REGLES_CALENDRIER,
  ...REGLES_PLACES,
  ...REGLES_CARACTERISTIQUES,
  ...REGLES_FINANCE,
  ...REGLES_DOCUMENTS,
  ...REGLES_ACTIVITE,
];
