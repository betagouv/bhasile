import type { AnomalieContexte } from "@/lib/anomalies/anomalie.contexte";
import type { AnomalieCode } from "@/types/anomalie.type";

export type AnomalieDetectee = {
  code: AnomalieCode;
  year: number;
  targetId: number;
};

// Passées explicitement pour que les règles restent pures : aucune ne lit l'horloge.
export type AnomalieOptions = {
  anneeCourante: number;
};

export type RegleAnomalie<
  K extends keyof AnomalieContexte = keyof AnomalieContexte,
> = {
  code: AnomalieCode;
  requiert: readonly K[];
  evalue: (
    contexte: Required<Pick<AnomalieContexte, K>>,
    options: AnomalieOptions
  ) => Omit<AnomalieDetectee, "code">[];
};

// Le cast efface le paramètre K pour permettre de stocker des règles hétérogènes dans un
// même tableau. Il est sûr parce que le runner n'appelle `evalue` qu'après avoir vérifié
// que toutes les tranches de `requiert` sont présentes.
export const defineRegle = <K extends keyof AnomalieContexte>(
  regle: RegleAnomalie<K>
): RegleAnomalie => regle as unknown as RegleAnomalie;
