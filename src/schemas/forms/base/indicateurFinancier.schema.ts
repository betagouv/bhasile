import z from "zod";

import { isNullOrUndefined } from "@/app/utils/common.util";
import { isYearRealisee } from "@/app/utils/indicateurFinancier.util";
import {
  zSafePositiveDecimalsNullish,
  zSafeYear,
} from "@/app/utils/zodCustomFields";
import { IndicateurFinancierType } from "@/types/indicateur-financier.type";

export const indicateurFinancierSchema = z.object({
  id: z.number().optional(),
  year: zSafeYear(),
  type: z.enum(IndicateurFinancierType),
  ETP: zSafePositiveDecimalsNullish(),
  tauxEncadrement: zSafePositiveDecimalsNullish(),
  coutJournalier: zSafePositiveDecimalsNullish(),
});

export const indicateursFinanciersSchema = z
  .object({
    indicateursFinanciers: z.array(indicateurFinancierSchema),
  })
  .refine(
    ({ indicateursFinanciers }) => {
      if (indicateursFinanciers.length === 0) {
        return false;
      }

      const everyYears = [
        ...new Set(indicateursFinanciers.map((ind) => ind.year)),
      ];

      for (const year of everyYears) {
        const isIndicateurFinancierRealiseFilled = isYearRealisee(
          indicateursFinanciers,
          year
        );

        if (isIndicateurFinancierRealiseFilled) {
          continue;
        }

        const indicateurFinancierPrevisionnel = indicateursFinanciers.find(
          (indicateurFinancier) =>
            indicateurFinancier.year === year &&
            indicateurFinancier.type === "PREVISIONNEL"
        );
        const isIndicateurFinancierPrevisionnelFilled =
          !isNullOrUndefined(indicateurFinancierPrevisionnel?.ETP) &&
          !isNullOrUndefined(
            indicateurFinancierPrevisionnel?.tauxEncadrement
          ) &&
          !isNullOrUndefined(indicateurFinancierPrevisionnel?.coutJournalier);
        if (isIndicateurFinancierPrevisionnelFilled) {
          continue;
        }
        return false;
      }

      return true;
    },
    {
      message:
        "Pour chaque année, il doit y avoir au moins un indicateur (ETP, taux d'encadrement, coût journalier) de type REALISE ou PREVISIONNEL rempli.",
      path: ["indicateursFinanciers"],
    }
  );

export type IndicateursFinanciersFormValues = z.infer<
  typeof indicateursFinanciersSchema
>;

export type IndicateurFinancierFormValues = z.infer<
  typeof indicateurFinancierSchema
>;
