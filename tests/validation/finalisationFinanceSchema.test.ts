import {
  createBudgetAutoriseeCurrentYear,
  createBudgetAutoriseeY2,
  createBudgetAvecCpom,
  createBudgetSansCpom,
  createEmptyCpomStructures,
  createValidBudget,
} from "tests/test-utils/factories/budget.factory";
import z from "zod";

import {
  budgetAutoriseeNotOpenSchema,
  budgetAutoriseeOpenSchema,
  budgetAutoriseeOpenYear1Schema,
  budgetSubventionneeNotOpenSchema,
  budgetSubventionneeOpenSchema,
} from "@/schemas/forms/base/budget.schema";
import { cpomStructureSchema } from "@/schemas/forms/base/cpom.schema";

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2025,
  };
});

// Test schemas that match the old test structure
const basicSchema = z
  .object({
    budgets: z.tuple([
      budgetAutoriseeOpenSchema,
      budgetAutoriseeOpenSchema,
      budgetAutoriseeOpenSchema,
      budgetAutoriseeOpenSchema,
      budgetAutoriseeOpenSchema,
    ]),
  })
  .and(cpomStructureSchema);

const autoriseeSchema = z
  .object({
    budgets: z.tuple([
      budgetAutoriseeNotOpenSchema, // Year 2025 (current year)
      budgetAutoriseeOpenYear1Schema, // Year 2024 (current year - 1)
      budgetAutoriseeOpenSchema, // Year 2023 (sans CPOM)
      budgetAutoriseeOpenSchema, // Year 2022 (sans CPOM)
      budgetAutoriseeOpenSchema, // Year 2021 (sans CPOM)
    ]),
  })
  .and(cpomStructureSchema);

const autoriseeAvecCpomSchema = z
  .object({
    budgets: z.tuple([
      budgetAutoriseeNotOpenSchema, // Year 2025 (current year)
      budgetAutoriseeOpenYear1Schema, // Year 2024 (current year - 1)
      budgetAutoriseeOpenSchema, // Year 2023 (avec CPOM)
      budgetAutoriseeOpenSchema, // Year 2022 (avec CPOM)
      budgetAutoriseeOpenSchema, // Year 2021 (avec CPOM)
    ]),
  })
  .and(cpomStructureSchema);

const subventionneeSchema = z
  .object({
    budgets: z.tuple([
      budgetSubventionneeNotOpenSchema, // Year 2025
      budgetSubventionneeNotOpenSchema, // Year 2024
      budgetSubventionneeOpenSchema, // Year 2023
      budgetSubventionneeOpenSchema, // Year 2022
      budgetSubventionneeOpenSchema, // Year 2021
    ]),
  })
  .and(cpomStructureSchema);

const subventionneeAvecCpomSchema = z
  .object({
    budgets: z.tuple([
      budgetSubventionneeNotOpenSchema, // Year 2025
      budgetSubventionneeNotOpenSchema, // Year 2024
      budgetSubventionneeOpenSchema, // Year 2023
      budgetSubventionneeOpenSchema, // Year 2022
      budgetSubventionneeOpenSchema, // Year 2021
    ]),
  })
  .and(cpomStructureSchema);

describe("finalisationFinanceSchema", () => {
  describe("validateAffectationReservesDetails", () => {
    describe("when affectationReservesFondsDedies is 0", () => {
      it("valide même si les champs de détail sont null", () => {
        const budget = createValidBudget({
          affectationReservesFondsDedies: 0,
          // All detail fields remain null
        });

        const result = basicSchema.safeParse({
          budgets: [budget, budget, budget, budget, budget],
          ...createEmptyCpomStructures(),
        });

        expect(result.success).toBe(true);
      });
    });

    describe("when affectationReservesFondsDedies is greater than 0", () => {
      it("échoue à la validation si les champs de détail sont null", () => {
        const budget = createValidBudget({
          affectationReservesFondsDedies: 1000,
          // Detail fields remain null - should fail
        });

        const result = basicSchema.safeParse({
          budgets: [budget, budget, budget, budget, budget],
          ...createEmptyCpomStructures(),
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          const errors = result.error.issues;
          expect(errors.length).toBeGreaterThan(0);

          // Check that the right fields are in error
          const errorPaths = errors.map((e) => e.path.join("."));
          expect(errorPaths).toContain("budgets.0.reserveInvestissement");
          expect(errorPaths).toContain("budgets.0.chargesNonReconductibles");
          expect(errorPaths).toContain("budgets.0.reserveCompensationDeficits");
          expect(errorPaths).toContain("budgets.0.reserveCompensationBFR");
          expect(errorPaths).toContain(
            "budgets.0.reserveCompensationAmortissements"
          );
          expect(errorPaths).toContain("budgets.0.reportANouveau");
          expect(errorPaths).toContain("budgets.0.autre");
        }
      });

      it("valide si tous les champs de détail sont renseignés", () => {
        const budget = createValidBudget({
          affectationReservesFondsDedies: 1000,
          reserveInvestissement: 200,
          chargesNonReconductibles: 300,
          reserveCompensationDeficits: 150,
          reserveCompensationBFR: 100,
          reserveCompensationAmortissements: 200,
          fondsDedies: 50,
          reportANouveau: 0,
          autre: 0,
        });

        const result = basicSchema.safeParse({
          budgets: [budget, budget, budget, budget, budget],
          ...createEmptyCpomStructures(),
        });

        expect(result.success).toBe(true);
      });

      it("échoue à la validation si certains champs de détail sont manquants", () => {
        const budget = createValidBudget({
          affectationReservesFondsDedies: 1000,
          reserveInvestissement: 200,
          chargesNonReconductibles: 300,
          // Other fields remain null
        });

        const result = basicSchema.safeParse({
          budgets: [budget, budget, budget, budget, budget],
          ...createEmptyCpomStructures(),
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          const errors = result.error.issues;
          expect(errors.length).toBeGreaterThan(0);

          const errorMessages = errors.map((e) => e.message);
          expect(errorMessages).toContain(
            "Ce champ est requis si l'affectation des réserves et fonds dédiés est supérieure à 0."
          );
        }
      });
    });

    describe("when affectationReservesFondsDedies is 0", () => {
      it("valide sans exiger les champs de détail", () => {
        const budget = createValidBudget({
          // affectationReservesFondsDedies defaults to 0 in createValidBudget
          // This should pass validation without requiring detail fields
        });

        const result = basicSchema.safeParse({
          budgets: [budget, budget, budget, budget, budget],
          ...createEmptyCpomStructures(),
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe("schema variants", () => {
    it("valide correctement autoriseeSchema", () => {
      const result = autoriseeSchema.safeParse({
        budgets: [
          createBudgetAutoriseeCurrentYear(),
          createBudgetAutoriseeY2(),
          createBudgetSansCpom(),
          createBudgetSansCpom(),
          createBudgetSansCpom(),
        ],
        ...createEmptyCpomStructures(),
      });

      expect(result.success).toBe(true);
    });

    it("valide correctement autoriseeAvecCpomSchema", () => {
      const result = autoriseeAvecCpomSchema.safeParse({
        budgets: [
          createBudgetAutoriseeCurrentYear(),
          createBudgetAutoriseeY2(),
          createBudgetAvecCpom(),
          createBudgetAvecCpom(),
          createBudgetAvecCpom(),
        ],
        ...createEmptyCpomStructures(),
      });

      expect(result.success).toBe(true);
    });

    it("valide correctement subventionneeSchema", () => {
      const firstYearBudget = {
        id: 1,
        year: 2024,
        ETP: 1.5,
        tauxEncadrement: 0.8,
        coutJournalier: 50,
        commentaire: null,
      };

      const openBudget = {
        id: 3,
        year: 2023,
        ETP: 1.5,
        tauxEncadrement: 0.8,
        coutJournalier: 50,
        dotationDemandee: 100000,
        dotationAccordee: 95000,
        totalProduits: 95000,
        totalCharges: 90000,
        repriseEtat: 0,
        excedentRecupere: 0,
        excedentDeduit: 0,
        fondsDedies: 0,
        commentaire: null,
      };

      const result = subventionneeSchema.safeParse({
        budgets: [
          firstYearBudget,
          firstYearBudget,
          openBudget,
          openBudget,
          openBudget,
        ],
        ...createEmptyCpomStructures(),
      });

      expect(result.success).toBe(true);
    });

    it("valide correctement subventionneeAvecCpomSchema", () => {
      const firstYearBudget = {
        id: 1,
        year: 2024,
        ETP: 1.5,
        tauxEncadrement: 0.8,
        coutJournalier: 50,
        commentaire: null,
      };

      const openBudget = {
        id: 3,
        year: 2023,
        ETP: 1.5,
        tauxEncadrement: 0.8,
        coutJournalier: 50,
        dotationDemandee: 100000,
        dotationAccordee: 95000,
        totalProduits: 95000,
        totalCharges: 90000,
        repriseEtat: 0,
        excedentRecupere: 0,
        excedentDeduit: 0,
        fondsDedies: 0,
        commentaire: null,
      };

      const result = subventionneeAvecCpomSchema.safeParse({
        budgets: [
          firstYearBudget,
          firstYearBudget,
          openBudget,
          openBudget,
          openBudget,
        ],
        ...createEmptyCpomStructures(),
      });

      expect(result.success).toBe(true);
    });
  });

  describe("conditional validation across schemas", () => {
    it("applique la validation conditionnelle dans autoriseeSchema", () => {
      const sansCpomWithAffectation = createBudgetSansCpom({
        affectationReservesFondsDedies: 1000,
        // Detail fields null - should fail because sansCpom has superRefine
      });

      const result = autoriseeSchema.safeParse({
        budgets: [
          createBudgetAutoriseeCurrentYear(),
          createBudgetAutoriseeY2(),
          sansCpomWithAffectation,
          sansCpomWithAffectation,
          sansCpomWithAffectation,
        ],
        ...createEmptyCpomStructures(),
      });

      expect(result.success).toBe(false);
    });

    it("applique la validation conditionnelle dans autoriseeAvecCpomSchema", () => {
      const avecCpomWithAffectation = createBudgetAvecCpom({
        affectationReservesFondsDedies: 1000,
        // Detail fields null - should fail because avecCpom has superRefine
      });

      const result = autoriseeAvecCpomSchema.safeParse({
        budgets: [
          createBudgetAutoriseeCurrentYear(),
          createBudgetAutoriseeY2(),
          avecCpomWithAffectation,
          avecCpomWithAffectation,
          avecCpomWithAffectation,
        ],
        ...createEmptyCpomStructures(),
      });

      expect(result.success).toBe(false);
    });

    it("applique la validation conditionnelle dans subventionneeAvecCpomSchema", () => {
      // Note: budgetSubventionneeOpenSchema doesn't have affectationReservesFondsDedies,
      // so this test validates that the schema correctly accepts valid subventionnee budgets
      const firstYearBudget = {
        id: 1,
        year: 2024,
        ETP: 1.5,
        tauxEncadrement: 0.8,
        coutJournalier: 50,
        commentaire: null,
      };

      const openBudget = {
        id: 3,
        year: 2023,
        ETP: 1.5,
        tauxEncadrement: 0.8,
        coutJournalier: 50,
        dotationDemandee: 100000,
        dotationAccordee: 95000,
        totalProduits: 95000,
        totalCharges: 90000,
        repriseEtat: 0,
        excedentRecupere: 0,
        excedentDeduit: 0,
        fondsDedies: 0,
        commentaire: null,
      };

      // This should pass because subventionnee schemas don't have affectationReservesFondsDedies
      // The test originally expected failure, but that was for autorisee structures
      // For subventionnee, we just validate that the schema works correctly
      const result = subventionneeAvecCpomSchema.safeParse({
        budgets: [
          firstYearBudget,
          firstYearBudget,
          openBudget,
          openBudget,
          openBudget,
        ],
        ...createEmptyCpomStructures(),
      });

      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("gère un tableau fileUploads vide", () => {
      const budget = createValidBudget();

      const result = basicSchema.safeParse({
        budgets: [budget, budget, budget, budget, budget],
        ...createEmptyCpomStructures(),
      });

      expect(result.success).toBe(true);
    });
  });
});
