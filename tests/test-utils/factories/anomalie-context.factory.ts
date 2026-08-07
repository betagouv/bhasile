import type {
  ActeContext,
  ActiviteContext,
  BudgetContext,
  CpomContext,
  IndicateurContext,
  StructureContext,
  TypologieContext,
} from "@/lib/anomalies/anomalie.type";
import { StructureType } from "@/types/structure.type";

export const TEST_CURRENT_YEAR = 2026;

export const structureContext = (
  overrides: Partial<StructureContext> = {}
): StructureContext => ({
  type: StructureType.CADA,
  departementAdministratif: "75",
  tarifJournalierCible: null,
  creationDate: new Date("2010-01-01"),
  date303: null,
  placesAutorisees: 100,
  lgbt: null,
  fvvTeh: null,
  debutConvention: null,
  finConvention: null,
  debutPeriodeAutorisation: null,
  finPeriodeAutorisation: null,
  ...overrides,
});

export const acteContext = (
  overrides: Partial<ActeContext> = {}
): ActeContext => ({
  id: 1,
  category: "CONVENTION",
  startDate: new Date("2020-01-01"),
  endDate: new Date("2025-01-01"),
  isMissing: null,
  parentId: null,
  cpomId: null,
  hasFile: true,
  ...overrides,
});

export const typologieContext = (
  overrides: Partial<TypologieContext> = {}
): TypologieContext => ({
  year: 2024,
  placesAutorisees: 100,
  pmr: 0,
  lgbt: 0,
  fvvTeh: 0,
  ...overrides,
});

export const budgetContext = (
  overrides: Partial<BudgetContext> = {}
): BudgetContext => ({
  year: 2024,
  isMissing: null,
  totalProduits: 1_000,
  totalCharges: 900,
  repriseEtat: null,
  excedentRecupere: null,
  excedentDeduit: null,
  fondsDedies: null,
  affectationReservesFondsDedies: null,
  reserveInvestissement: null,
  chargesNonReconductibles: null,
  reserveCompensationDeficits: null,
  reserveCompensationBFR: null,
  reserveCompensationAmortissements: null,
  reportANouveau: null,
  autre: null,
  ...overrides,
});

export const indicateurContext = (
  overrides: Partial<IndicateurContext> = {}
): IndicateurContext => ({
  year: 2024,
  type: "REALISE",
  isMissing: null,
  tauxEncadrement: 10,
  coutJournalier: 30,
  ...overrides,
});

export const cpomContext = (
  overrides: Partial<CpomContext> = {}
): CpomContext => ({
  id: 1,
  structuresCount: 3,
  hasConventionDocument: true,
  ...overrides,
});

export const activiteContext = (
  overrides: Partial<ActiviteContext> = {}
): ActiviteContext => ({
  dnaCode: "C7500001",
  placesAutorisees: 100,
  placesIndisponibles: 0,
  presencesInduesBPI: 0,
  presencesInduesDeboutees: 0,
  ...overrides,
});
