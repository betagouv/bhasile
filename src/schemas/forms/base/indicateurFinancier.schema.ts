import z from "zod";

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
        const indicateurFinancierRealise = indicateursFinanciers.find(
          (ind) => ind.year === year && ind.type === "REALISE"
        );
        const isIndicateurFinancierRealiseFilled =
          indicateurFinancierRealise?.ETP !== undefined &&
          indicateurFinancierRealise?.tauxEncadrement !== undefined &&
          indicateurFinancierRealise?.coutJournalier !== undefined;

        if (isIndicateurFinancierRealiseFilled) {
          continue;
        }

        const indicateurFinancierPrevisionnel = indicateursFinanciers.find(
          (ind) => ind.year === year && ind.type === "PREVISIONNEL"
        );
        const isIndicateurFinancierPrevisionnelFilled =
          indicateurFinancierPrevisionnel?.ETP !== undefined &&
          indicateurFinancierPrevisionnel?.tauxEncadrement !== undefined &&
          indicateurFinancierPrevisionnel?.coutJournalier !== undefined;
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
