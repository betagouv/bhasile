import z from "zod";

import { zSafeDecimalsNullish, zSafeYear } from "@/app/utils/zodCustomFields";
import { zSafeDecimals } from "@/app/utils/zodSafeDecimals";
import { cpomStructureApiSchema } from "@/schemas/api/cpom.schema";

import { validateAffectationReservesDetails } from "./budget/validateAffectationReservesDetails";

export const budgetBaseSchema = z.object({
  id: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.number().optional()
  ),
  year: zSafeYear(),

  // Indicateurs généraux
  ETP: zSafeDecimals(),
  tauxEncadrement: zSafeDecimals(),
  coutJournalier: zSafeDecimals(),

  commentaire: z.string().nullish(),
});

export const budgetAutoriseeNotOpenSchema = budgetBaseSchema.extend({
  dotationDemandee: zSafeDecimals(),
});

export const budgetAutoriseeOpenYear1Schema =
  budgetAutoriseeNotOpenSchema.extend({
    dotationAccordee: zSafeDecimals(),
  });

const budgetAutoriseeOpenSchemaWithoutRefinement =
  budgetAutoriseeOpenYear1Schema.extend({
    // Résultat
    totalProduitsProposes: zSafeDecimals(),
    totalProduits: zSafeDecimals(),
    totalChargesProposees: zSafeDecimals(),
    repriseEtat: zSafeDecimals(),
    excedentRecupere: zSafeDecimals(),
    excedentDeduit: zSafeDecimals(),
    fondsDedies: zSafeDecimals(),
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
  budgetAutoriseeOpenSchemaWithoutRefinement.superRefine(
    validateAffectationReservesDetails
  );

export const budgetSubventionneeNotOpenSchema = budgetBaseSchema; // Duplicated for comprehensibility

export const budgetSubventionneeOpenSchema = budgetBaseSchema.extend({
  dotationDemandee: zSafeDecimals(),
  dotationAccordee: zSafeDecimals(),
  totalProduits: zSafeDecimals(),
  totalCharges: zSafeDecimals(),
  repriseEtat: zSafeDecimals(),
  excedentRecupere: zSafeDecimals(),
  excedentDeduit: zSafeDecimals(),
  fondsDedies: zSafeDecimals(),
});

export const budgetAutoSaveSchema = budgetAutoriseeOpenSchemaWithoutRefinement
  .partial()
  .and(budgetSubventionneeOpenSchema.partial())
  .and(
    z.object({
      year: zSafeYear(),
    })
  );

export const cpomStructureSchema = z.object({
  cpomStructures: z.array(cpomStructureApiSchema),
});

export const budgetsAutoSaveSchema = z
  .object({
    budgets: z.array(budgetAutoSaveSchema),
  })
  .and(cpomStructureSchema);

export type BudgetsAutoSaveFormValues = z.infer<typeof budgetsAutoSaveSchema>;

export type anyFinanceFormValues = Array<
  | z.infer<typeof budgetAutoriseeNotOpenSchema>
  | z.infer<typeof budgetAutoriseeOpenYear1Schema>
  | z.infer<typeof budgetAutoriseeOpenSchema>
  | z.infer<typeof budgetSubventionneeNotOpenSchema>
  | z.infer<typeof budgetSubventionneeOpenSchema>
  | z.infer<typeof budgetAutoSaveSchema>
>;
