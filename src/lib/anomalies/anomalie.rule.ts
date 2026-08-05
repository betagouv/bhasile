import type { AnomalieContext } from "@/lib/anomalies/anomalie.context";
import type { AnomalieCode } from "@/types/anomalie.type";

export type DetectedAnomalie = {
  code: AnomalieCode;
  year: number;
  targetId: number;
};

// Passées explicitement pour que les règles restent pures : aucune ne lit l'horloge.
export type AnomalieOptions = {
  currentYear: number;
};

export type AnomalieRule<
  K extends keyof AnomalieContext = keyof AnomalieContext,
> = {
  code: AnomalieCode;
  requires: readonly K[];
  evaluates: (
    context: Required<Pick<AnomalieContext, K>>,
    options: AnomalieOptions
  ) => Omit<DetectedAnomalie, "code">[];
};

// Le cast efface le paramètre K pour permettre de stocker des règles hétérogènes dans un
// même tableau. Il est sûr parce que le runner n'appelle `evaluates` qu'après avoir vérifié
// que toutes les tranches de `requires` sont présentes.
export const defineRule = <K extends keyof AnomalieContext>(
  rule: AnomalieRule<K>
): AnomalieRule => rule as unknown as AnomalieRule;
