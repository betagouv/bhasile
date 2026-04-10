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
      const byYear: Record<
        number,
        { [key: string]: { REALISE?: boolean; PREVISIONNEL?: boolean } }
      > = {};

      for (const ind of indicateursFinanciers) {
        const year = Number(ind.year);
        if (!byYear[year]) {
          byYear[year] = {
            ETP: {},
            tauxEncadrement: {},
            coutJournalier: {},
          };
        }

        if (
          ind.ETP != null &&
          (ind.type === "REALISE" || ind.type === "PREVISIONNEL")
        ) {
          byYear[year].ETP[ind.type] = true;
        }
        if (
          ind.tauxEncadrement != null &&
          (ind.type === "REALISE" || ind.type === "PREVISIONNEL")
        ) {
          byYear[year].tauxEncadrement[ind.type] = true;
        }
        if (
          ind.coutJournalier != null &&
          (ind.type === "REALISE" || ind.type === "PREVISIONNEL")
        ) {
          byYear[year].coutJournalier[ind.type] = true;
        }
      }

      for (const yearData of Object.values(byYear)) {
        for (const key of ["ETP", "tauxEncadrement", "coutJournalier"]) {
          if (
            !(
              yearData[key].REALISE === true ||
              yearData[key].PREVISIONNEL === true
            )
          ) {
            return false;
          }
        }
      }

      return true;
    },
    {
      message:
        "Pour chaque année, il doit y avoir au moins un indicateur (ETP, taux d'encadrement, coût journalier) de type REALISE ou PREVISIONNEL rempli.",
      path: ["indicateursFinanciers"],
    }
  );
