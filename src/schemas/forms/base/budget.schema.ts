import z from "zod";

import { isNullOrUndefined } from "@/app/utils/common.util";
import {
  zId,
  zSafeDecimals,
  zSafeDecimalsNullish,
  zSafePositiveDecimals,
  zSafePositiveDecimalsNullish,
  zSafeYear,
} from "@/app/utils/zodCustomFields";

import { validateAffectationReservesDetails } from "./budget/validateAffectationReservesDetails";
import { cpomStructureSchema } from "./cpom.schema";

export const budgetBaseSchema = z.object({
  id: zId(),
  year: zSafeYear(),

  // Indicateurs généraux
  ETP: zSafePositiveDecimals(),
  tauxEncadrement: zSafePositiveDecimals(),
  coutJournalier: zSafePositiveDecimals(),

  commentaire: z.string().nullish(),
});

export const budgetAutoriseeNotOpenSchema = budgetBaseSchema.extend({
  dotationDemandee: zSafePositiveDecimals(),
});

export const budgetAutoriseeOpenYear1Schema =
  budgetAutoriseeNotOpenSchema.extend({
    dotationAccordee: zSafePositiveDecimals(),
  });

export const budgetAutoriseeOpenSchemaWithoutRefinement =
  budgetAutoriseeOpenYear1Schema.extend({
    // Résultat
    totalProduitsProposes: zSafePositiveDecimalsNullish(),
    totalProduits: zSafePositiveDecimals(),
    totalChargesProposees: zSafePositiveDecimals(),
    totalCharges: zSafePositiveDecimals(),
    repriseEtat: zSafeDecimals(),
    affectationReservesFondsDedies: zSafeDecimals(),

    // Détail affectation
    reserveInvestissement: zSafeDecimalsNullish(),
    chargesNonReconductibles: zSafeDecimalsNullish(),
    reserveCompensationDeficits: zSafeDecimalsNullish(),
    reserveCompensationBFR: zSafeDecimalsNullish(),
    reserveCompensationAmortissements: zSafeDecimalsNullish(),
    reportANouveau: zSafeDecimalsNullish(),
    autre: zSafeDecimalsNullish(),
  });

export const budgetAutoriseeOpenSchema =
  budgetAutoriseeOpenSchemaWithoutRefinement
    .superRefine(validateAffectationReservesDetails)
    .refine(
      (data) => {
        if (data.year > 2023 && isNullOrUndefined(data.totalProduitsProposes)) {
          return false;
        }
        return true;
      },
      {
        message:
          "Total produits proposés est obligatoire pour les années après 2023",
        path: ["totalProduitsProposes"],
      }
    );

export const budgetSubventionneeNotOpenSchema = budgetBaseSchema; // Duplicated for comprehensibility

export const budgetSubventionneeOpenSchema = budgetBaseSchema.extend({
  dotationDemandee: zSafePositiveDecimals(),
  dotationAccordee: zSafePositiveDecimals(),
  totalProduits: zSafePositiveDecimals(),
  totalCharges: zSafePositiveDecimals(),
  repriseEtat: zSafeDecimals(),
  excedentRecupere: zSafePositiveDecimals(),
  excedentDeduit: zSafePositiveDecimals(),
  fondsDedies: zSafePositiveDecimals(),
});

// TODO: cannot find a way to avoid duplication
export const budgetAutoSaveSchema = z.object({
  id: zId(),
  year: zSafeYear(),
  ETP: zSafePositiveDecimalsNullish(),
  tauxEncadrement: zSafePositiveDecimalsNullish(),
  coutJournalier: zSafePositiveDecimalsNullish(),
  dotationDemandee: zSafePositiveDecimalsNullish(),
  dotationAccordee: zSafePositiveDecimalsNullish(),
  totalProduitsProposes: zSafePositiveDecimalsNullish(),
  totalProduits: zSafePositiveDecimalsNullish(),
  totalChargesProposees: zSafePositiveDecimalsNullish(),
  totalCharges: zSafePositiveDecimalsNullish(),
  repriseEtat: zSafeDecimalsNullish(),
  excedentRecupere: zSafePositiveDecimalsNullish(),
  excedentDeduit: zSafePositiveDecimalsNullish(),
  fondsDedies: zSafePositiveDecimalsNullish(),
  affectationReservesFondsDedies: zSafeDecimalsNullish(),
  reserveInvestissement: zSafeDecimalsNullish(),
  chargesNonReconductibles: zSafeDecimalsNullish(),
  reserveCompensationDeficits: zSafeDecimalsNullish(),
  reserveCompensationBFR: zSafeDecimalsNullish(),
  reserveCompensationAmortissements: zSafeDecimalsNullish(),
  reportANouveau: zSafeDecimalsNullish(),
  autre: zSafeDecimalsNullish(),
  commentaire: z.string().nullish(),
});

export const budgetInCpomSchema = budgetAutoriseeOpenSchemaWithoutRefinement
  .partial()
  .and(budgetSubventionneeOpenSchema.partial())
  .and(
    z.object({
      year: zSafeYear(),
      ETP: zSafePositiveDecimals(),
      tauxEncadrement: zSafePositiveDecimals(),
      coutJournalier: zSafePositiveDecimals(),
    })
  );

export const budgetsAutoSaveSchema = z
  .object({
    budgets: z.array(budgetAutoSaveSchema),
  })
  .and(z.object({ cpomStructures: z.array(cpomStructureSchema) }));

export type BudgetsAutoSaveFormValues = z.infer<typeof budgetsAutoSaveSchema>;

export type anyBudgetFormValues = Array<
  | z.infer<typeof budgetAutoriseeNotOpenSchema>
  | z.infer<typeof budgetAutoriseeOpenYear1Schema>
  | z.infer<typeof budgetAutoriseeOpenSchema>
  | z.infer<typeof budgetSubventionneeNotOpenSchema>
  | z.infer<typeof budgetSubventionneeOpenSchema>
  | z.infer<typeof budgetAutoSaveSchema>
>;
