import {
  autoriseeAvecCpomSchema,
  autoriseeSchema,
  basicSchema,
  subventionneeAvecCpomSchema,
  subventionneeSchema,
} from "@/schemas/forms/base/budget.schema.old";

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2025,
  };
});

describe("finalisationFinanceSchema", () => {
  // Helper to create a valid budget base
  const createValidBudget = (overrides = {}) => ({
    id: 1,
    year: 2024,
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
    affectationReservesFondsDedies: 0,
    cumulResultatsNetsCPOM: 5000,
    totalChargesProposees: 90000,
    reserveInvestissement: null,
    chargesNonReconductibles: null,
    reserveCompensationDeficits: null,
    reserveCompensationBFR: null,
    reserveCompensationAmortissements: null,
    fondsDedies: 0,
    reportANouveau: null,
    autre: null,
    commentaire: null,
    ...overrides,
  });

  // Helper for autoriseeCurrentYear budget
  const createAutoriseeCurrentYear = (overrides = {}) => ({
    id: 1,
    year: 2024,
    ETP: 1.5,
    tauxEncadrement: 0.8,
    coutJournalier: 50,
    dotationDemandee: 100000,
    dotationAccordee: 95000,
    totalProduits: null,
    totalCharges: null,
    repriseEtat: null,
    excedentRecupere: null,
    excedentDeduit: null,
    affectationReservesFondsDedies: null,
    cumulResultatsNetsCPOM: null,
    totalChargesProposees: null,
    reserveInvestissement: null,
    chargesNonReconductibles: null,
    reserveCompensationDeficits: null,
    reserveCompensationBFR: null,
    reserveCompensationAmortissements: null,
    fondsDedies: null,
    commentaire: null,
    ...overrides,
  });

  // Helper for autoriseeY2 budget
  const createAutoriseeY2 = (overrides = {}) => ({
    id: 2,
    year: 2025,
    ETP: 1.5,
    tauxEncadrement: 0.8,
    coutJournalier: 50,
    dotationDemandee: 100000,
    dotationAccordee: 95000,
    totalProduits: null,
    totalCharges: null,
    repriseEtat: null,
    excedentRecupere: null,
    excedentDeduit: null,
    affectationReservesFondsDedies: null,
    cumulResultatsNetsCPOM: null,
    totalChargesProposees: null,
    reserveInvestissement: null,
    chargesNonReconductibles: null,
    reserveCompensationDeficits: null,
    reserveCompensationBFR: null,
    reserveCompensationAmortissements: null,
    fondsDedies: null,
    commentaire: null,
    ...overrides,
  });

  // Helper for sansCpom budget
  const createSansCpom = (overrides = {}) => ({
    id: 4,
    year: 2024,
    ETP: 1.5,
    tauxEncadrement: 0.8,
    coutJournalier: 50,
    dotationDemandee: 100000,
    dotationAccordee: 95000,
    totalProduits: 95000,
    totalCharges: 90000,
    repriseEtat: 0,
    excedentRecupere: null,
    excedentDeduit: null,
    affectationReservesFondsDedies: 0,
    cumulResultatsNetsCPOM: null,
    totalChargesProposees: 90000,
    reserveInvestissement: null,
    chargesNonReconductibles: null,
    reserveCompensationDeficits: null,
    reserveCompensationBFR: null,
    reserveCompensationAmortissements: null,
    fondsDedies: null,
    reportANouveau: null,
    autre: null,
    commentaire: null,
    ...overrides,
  });

  // Helper for avecCpom budget
  const createAvecCpom = (overrides = {}) => ({
    id: 5,
    year: 2024,
    ETP: 1.5,
    tauxEncadrement: 0.8,
    coutJournalier: 50,
    dotationDemandee: 100000,
    dotationAccordee: 95000,
    totalProduits: 95000,
    totalCharges: 90000,
    repriseEtat: 0,
    excedentRecupere: null,
    excedentDeduit: null,
    affectationReservesFondsDedies: 0,
    cumulResultatsNetsCPOM: 5000,
    totalChargesProposees: 90000,
    reserveInvestissement: null,
    chargesNonReconductibles: null,
    reserveCompensationDeficits: null,
    reserveCompensationBFR: null,
    reserveCompensationAmortissements: null,
    fondsDedies: null,
    reportANouveau: null,
    autre: null,
    commentaire: null,
    ...overrides,
  });

  describe("validateAffectationReservesDetails", () => {
    describe("when affectationReservesFondsDedies is 0", () => {
      it("should pass validation even if detail fields are null", () => {
        const budget = createValidBudget({
          affectationReservesFondsDedies: 0,
          // All detail fields remain null
        });

        const result = basicSchema.safeParse({
          budgets: [budget, budget, budget, budget, budget],
        });

        expect(result.success).toBe(true);
      });
    });

    describe("when affectationReservesFondsDedies is greater than 0", () => {
      it("should fail validation if detail fields are null", () => {
        const budget = createValidBudget({
          affectationReservesFondsDedies: 1000,
          // Detail fields remain null - should fail
        });

        const result = basicSchema.safeParse({
          budgets: [budget, budget, budget, budget, budget],
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          const errors = result.error.errors;
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
        }
      });

      it("should pass validation if all detail fields are provided", () => {
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
        });

        expect(result.success).toBe(true);
      });

      it("should fail validation if some detail fields are missing", () => {
        const budget = createValidBudget({
          affectationReservesFondsDedies: 1000,
          reserveInvestissement: 200,
          chargesNonReconductibles: 300,
          // Other fields remain null
        });

        const result = basicSchema.safeParse({
          budgets: [budget, budget, budget, budget, budget],
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          const errors = result.error.errors;
          expect(errors.length).toBeGreaterThan(0);

          const errorMessages = errors.map((e) => e.message);
          expect(errorMessages).toContain(
            "Ce champ est requis si l'affectation des réserves et fonds dédiés est supérieure à 0."
          );
        }
      });
    });

    describe("when affectationReservesFondsDedies is 0", () => {
      it("should pass validation", () => {
        const budget = createValidBudget({
          // affectationReservesFondsDedies defaults to 0 in createValidBudget
          // This should pass validation without requiring detail fields
        });

        const result = basicSchema.safeParse({
          budgets: [budget, budget, budget, budget, budget],
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe("schema variants", () => {
    it("should validate autoriseeSchema correctly", () => {
      const result = autoriseeSchema.safeParse({
        budgets: [
          createAutoriseeCurrentYear(),
          createAutoriseeY2(),
          createSansCpom(),
          createSansCpom(),
          createSansCpom(),
        ],
      });

      expect(result.success).toBe(true);
    });

    it("should validate autoriseeAvecCpomSchema correctly", () => {
      const result = autoriseeAvecCpomSchema.safeParse({
        budgets: [
          createAutoriseeCurrentYear(),
          createAutoriseeY2(),
          createAvecCpom(),
          createAvecCpom(),
          createAvecCpom(),
        ],
      });

      expect(result.success).toBe(true);
    });

    it("should validate subventionneeSchema correctly", () => {
      const firstYearBudget = {
        id: 1,
        year: 2024,
        ETP: 1.5,
        tauxEncadrement: 0.8,
        coutJournalier: 50,
      };

      const sansCpomBudget = createValidBudget({
        cumulResultatsNetsCPOM: 5000,
        affectationReservesFondsDedies: null,
        chargesNonReconductibles: null,
        reserveCompensationAmortissements: null,
        reserveCompensationBFR: null,
        reserveCompensationDeficits: null,
        reserveInvestissement: null,
        totalChargesProposees: null,
      });

      const result = subventionneeSchema.safeParse({
        budgets: [
          firstYearBudget,
          firstYearBudget,
          sansCpomBudget,
          sansCpomBudget,
          sansCpomBudget,
        ],
      });

      expect(result.success).toBe(true);
    });

    it("should validate subventionneeAvecCpomSchema correctly", () => {
      const firstYearBudget = {
        id: 1,
        year: 2024,
        ETP: 1.5,
        tauxEncadrement: 0.8,
        coutJournalier: 50,
      };

      const cpomBudget = createValidBudget({
        totalChargesProposees: 90000,
      });

      const result = subventionneeAvecCpomSchema.safeParse({
        budgets: [
          firstYearBudget,
          firstYearBudget,
          cpomBudget,
          cpomBudget,
          cpomBudget,
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("conditional validation across schemas", () => {
    it("should enforce conditional validation in autoriseeSchema", () => {
      const sansCpomWithAffectation = createSansCpom({
        affectationReservesFondsDedies: 1000,
        // Detail fields null - should fail because sansCpom has superRefine
      });

      const result = autoriseeSchema.safeParse({
        budgets: [
          createAutoriseeCurrentYear(),
          createAutoriseeY2(),
          sansCpomWithAffectation,
          sansCpomWithAffectation,
          sansCpomWithAffectation,
        ],
      });

      expect(result.success).toBe(false);
    });

    it("should enforce conditional validation in autoriseeAvecCpomSchema", () => {
      const avecCpomWithAffectation = createAvecCpom({
        affectationReservesFondsDedies: 1000,
        // Detail fields null - should fail because avecCpom has superRefine
      });

      const result = autoriseeAvecCpomSchema.safeParse({
        budgets: [
          createAutoriseeCurrentYear(),
          createAutoriseeY2(),
          avecCpomWithAffectation,
          avecCpomWithAffectation,
          avecCpomWithAffectation,
        ],
      });

      expect(result.success).toBe(false);
    });

    it("should enforce conditional validation in subventionneeAvecCpomSchema", () => {
      const firstYearBudget = {
        id: 1,
        year: 2024,
        ETP: 1.5,
        tauxEncadrement: 0.8,
        coutJournalier: 50,
      };

      const budgetWithAffectation = createAvecCpom({
        affectationReservesFondsDedies: 1000,
        totalChargesProposees: 90000,
        // Detail fields null - should fail because avecCpom has superRefine
      });

      const result = subventionneeAvecCpomSchema.safeParse({
        budgets: [
          firstYearBudget,
          firstYearBudget,
          budgetWithAffectation,
          budgetWithAffectation,
          budgetWithAffectation,
        ],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle empty fileUploads array", () => {
      const budget = createValidBudget();

      const result = basicSchema.safeParse({
        budgets: [budget, budget, budget, budget, budget],
      });

      expect(result.success).toBe(true);
    });
  });
});
