import z from "zod";

import {
  isYearPrevisionnelle,
  isYearRealisee,
} from "@/app/utils/indicateurFinancier.util";
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

const indicateursFinanciersObjectSchema = z.object({
  indicateursFinanciers: z.array(indicateurFinancierSchema),
});

export const getIndicateursFinanciersSchema = (cutoffYear: number) =>
  indicateursFinanciersObjectSchema.check(
    z.superRefine(({ indicateursFinanciers }, ctx) => {
      if (indicateursFinanciers.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["indicateursFinanciers"],
          message: "Au moins un indicateur financier est requis.",
        });
        return;
      }

      const everyYears = [
        ...new Set(indicateursFinanciers.map((ind) => ind.year)),
      ];

      for (const year of everyYears) {
        if (year <= cutoffYear) {
          if (!isYearRealisee(indicateursFinanciers, year)) {
            ctx.addIssue({
              code: "custom",
              path: ["indicateursFinanciers", year],
              message: `Le réalisé ${year} (ETP, taux d'encadrement, coût journalier) est obligatoire.`,
            });
          }
          continue;
        }

        if (
          !isYearRealisee(indicateursFinanciers, year) &&
          !isYearPrevisionnelle(indicateursFinanciers, year)
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["indicateursFinanciers", year],
            message: `Un indicateur réalisé ou prévisionnel ${year} (ETP, taux d'encadrement, coût journalier) est requis.`,
          });
        }
      }
    })
  );

export type IndicateursFinanciersFormValues = z.infer<
  typeof indicateursFinanciersObjectSchema
>;

export type IndicateurFinancierFormValues = z.infer<
  typeof indicateurFinancierSchema
>;
