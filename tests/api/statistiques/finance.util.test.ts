import { describe, expect, it } from "vitest";

import { computeFinanceStatistiques } from "@/app/api/statistiques/finance/finance.util";
import { computeStructureJoursPlaces } from "@/app/api/statistiques/finance/finance-theorique.util";
import type {
  StatistiqueDbBudget,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActiveStructureIdsByPeriod,
  buildTestStatistiquesContext,
  buildTestStructureVersionTimeline,
} from "./test-helpers";

const testStructure = (
  id: number,
  type: StructureType,
  departementAdministratif = "75"
): StatistiqueDbStructure => ({
  id,
  type,
  departementAdministratif,
});

const budgetRow = (
  id: number,
  structureId: number,
  year: number,
  totalProduits: number,
  totalCharges: number,
  overrides: Partial<
    Pick<StatistiqueDbBudget, "dotationDemandee" | "dotationAccordee">
  > = {}
): StatistiqueDbBudget => ({
  id,
  structureId,
  year,
  dotationDemandee: overrides.dotationDemandee ?? 0,
  dotationAccordee: overrides.dotationAccordee ?? 0,
  totalProduits,
  totalCharges,
});

const indicateurRow = (
  id: number,
  structureId: number,
  year: number,
  type: "REALISE" | "PREVISIONNEL",
  overrides: Partial<
    Pick<
      StatistiqueDbIndicateurFinancier,
      "ETP" | "tauxEncadrement" | "coutJournalier"
    >
  > = {}
): StatistiqueDbIndicateurFinancier => ({
  id,
  structureId,
  year,
  type,
  ETP: overrides.ETP ?? null,
  tauxEncadrement: overrides.tauxEncadrement ?? null,
  coutJournalier: overrides.coutJournalier ?? null,
});

const typologieRow = (
  structureId: number,
  year: number,
  placesAutorisees: number
): StatistiqueDbTypologie => ({
  id: structureId * 10_000 + year,
  structureId,
  year,
  placesAutorisees,
  pmr: 0,
  lgbt: 0,
  fvvTeh: 0,
});

const cibleTarif = (year: number, isIdf: boolean, tarifCible: number) => ({
  structureType: StructureType.CADA,
  year,
  isIdf,
  tarifCible,
});

const cibleTaux = (
  year: number,
  isIdf: boolean,
  isFromHuda: boolean,
  tauxCible: number
) => ({
  structureType: StructureType.CADA,
  year,
  isIdf,
  isFromHuda,
  tauxCible,
});

const buildFinanceContext = (args: {
  structures: StatistiqueDbStructure[];
  typologies?: StatistiqueDbTypologie[];
  budgets?: StatistiqueDbBudget[];
  indicateurs?: StatistiqueDbIndicateurFinancier[];
}) => {
  const budgets = args.budgets ?? [];
  const indicateurs = args.indicateurs ?? [];
  const years = [
    ...new Set([
      ...budgets.map((budget) => budget.year),
      ...indicateurs.map((indicateur) => indicateur.year),
    ]),
  ];

  return buildTestStatistiquesContext({
    structures: args.structures,
    allStructures: args.structures,
    typologies: args.typologies ?? [],
    adresses: [],
    departements: [],
    budgets,
    indicateurs,
    activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod(
      args.structures.map((structure) => structure.id),
      { financeYears: years }
    ),
  });
};

describe("finance - périmètres autorisées / subventionnées / total", () => {
  it("répartit les budgets et les résultats nets sur les trois scopes", () => {
    const structures = [
      testStructure(1, StructureType.CADA),
      testStructure(2, StructureType.CPH),
      testStructure(3, StructureType.HUDA),
      testStructure(4, StructureType.CAES),
    ];

    const budgets = [
      budgetRow(1, 1, 2024, 200, 100), // +100 (autorisee)
      budgetRow(2, 2, 2024, 90, 110), // -20 (autorisee)
      budgetRow(3, 3, 2024, 50, 90), // -40 (subventionnee)
      budgetRow(4, 4, 2024, 70, 60), // +10 (subventionnee)
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext({ structures, budgets }),
      "moyenne"
    );
    const year2024 = result.byYear.find((entry) => entry.year === 2024);

    expect(year2024?.total.resultatNet).toBe(50);
    expect(year2024?.total.excedentCumule).toBe(110);
    expect(year2024?.total.deficitCumule).toBe(60);

    expect(year2024?.autorisees.resultatNet).toBe(80);
    expect(year2024?.autorisees.excedentCumule).toBe(100);
    expect(year2024?.autorisees.deficitCumule).toBe(20);

    expect(year2024?.subventionnees.resultatNet).toBe(-30);
    expect(year2024?.subventionnees.excedentCumule).toBe(10);
    expect(year2024?.subventionnees.deficitCumule).toBe(40);
  });

  it("n'infère pas de budgets sur une année absente du scope (zéros)", () => {
    const structures = [
      testStructure(1, StructureType.CADA),
      testStructure(2, StructureType.HUDA),
    ];

    const budgets = [
      budgetRow(1, 1, 2024, 100, 80), // autorisee
      budgetRow(2, 2, 2024, 60, 90), // subventionnee
      budgetRow(3, 1, 2025, 0, 0), // uniquement autorisee en 2025
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext({ structures, budgets }),
      "moyenne"
    );
    const year2025 = result.byYear.find((entry) => entry.year === 2025);

    expect(year2025?.subventionnees.totalProduits).toBe(0);
    expect(year2025?.subventionnees.totalCharges).toBe(0);
    expect(year2025?.subventionnees.resultatNet).toBe(0);
    expect(year2025?.subventionnees.excedentCumule).toBe(0);
    expect(year2025?.subventionnees.deficitCumule).toBe(0);
  });
});

describe("finance - ETP prévisionnel et réel", () => {
  it("somme séparément le prévisionnel et le réalisé, sans repli", () => {
    const structures = [
      testStructure(1, StructureType.CADA),
      testStructure(2, StructureType.CAES),
    ];

    const indicateurs = [
      indicateurRow(1, 1, 2024, "REALISE", { ETP: 10 }),
      indicateurRow(2, 1, 2024, "PREVISIONNEL", { ETP: 12 }),
      indicateurRow(3, 2, 2024, "PREVISIONNEL", { ETP: 5 }),
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext({ structures, indicateurs }),
      "moyenne"
    );
    const year2024 = result.byYear.find((entry) => entry.year === 2024);

    expect(year2024?.total.totalETPPrevisionnel).toBe(17);
    expect(year2024?.total.totalETPRealise).toBe(10);
    expect(year2024?.subventionnees.totalETPRealise).toBeNull();
  });
});

describe("finance - indicateurs théoriques", () => {
  const structures = [
    testStructure(1, StructureType.CADA),
    testStructure(2, StructureType.CPH),
    testStructure(3, StructureType.HUDA),
  ];
  const typologies = [
    typologieRow(1, 2024, 100),
    typologieRow(2, 2024, 50),
    typologieRow(3, 2024, 30),
  ];

  it("ignore le taux et le coût saisis par l'opérateur", () => {
    const result = computeFinanceStatistiques(
      buildFinanceContext({
        structures,
        typologies,
        indicateurs: [
          indicateurRow(1, 1, 2024, "REALISE", {
            tauxEncadrement: 99,
            coutJournalier: 99,
          }),
        ],
      }),
      "moyenne"
    );
    const year2024 = result.byYear.find((entry) => entry.year === 2024);

    expect(year2024?.total.tauxEncadrementTheoriqueRealise).toBeNull();
    expect(year2024?.total.coutJournalierTheorique).toBeNull();
  });

  it("calcule le taux théorique en places par ETP, puis moyenne ou médiane", () => {
    const indicateurs = [
      indicateurRow(1, 1, 2024, "REALISE", { ETP: 10 }), // 10
      indicateurRow(2, 2, 2024, "REALISE", { ETP: 10 }), // 5
      indicateurRow(3, 3, 2024, "REALISE", { ETP: 10 }), // 3
      indicateurRow(4, 1, 2024, "PREVISIONNEL", { ETP: 20 }), // 5
    ];
    const context = buildFinanceContext({ structures, typologies, indicateurs });

    const mean2024 = computeFinanceStatistiques(context, "moyenne").byYear[0];
    const median2024 = computeFinanceStatistiques(context, "mediane").byYear[0];

    expect(mean2024.total.tauxEncadrementTheoriqueRealise).toBe(6);
    expect(median2024.total.tauxEncadrementTheoriqueRealise).toBe(5);
    expect(mean2024.total.tauxEncadrementTheoriquePrevisionnel).toBe(5);
    expect(mean2024.subventionnees.tauxEncadrementTheoriqueRealise).toBe(3);
  });

  it("calcule le coût théorique en dotation accordée par jour et par place", () => {
    const budgets = [
      budgetRow(1, 1, 2024, 0, 0, { dotationAccordee: 100 * 366 * 20 }),
      budgetRow(2, 2, 2024, 0, 0, { dotationAccordee: 50 * 366 * 30 }),
      budgetRow(3, 3, 2024, 0, 0, { dotationAccordee: 0 }),
    ];

    const result = computeFinanceStatistiques(
      buildFinanceContext({ structures, typologies, budgets }),
      "moyenne"
    );

    expect(result.byYear[0].total.coutJournalierTheorique).toBe(25);
    expect(result.byYear[0].subventionnees.coutJournalierTheorique).toBeNull();
  });

  it("applique les cibles selon le type, l'année, le zonage IDF et l'origine HUDA", () => {
    const context = {
      ...buildFinanceContext({
        structures: [
          testStructure(1, StructureType.CADA, "75"),
          testStructure(2, StructureType.CADA, "01"),
          testStructure(3, StructureType.CADA, "01"),
        ],
        budgets: [budgetRow(1, 1, 2024, 0, 0)],
      }),
      idfDepartementNumeros: new Set(["75"]),
      cadaFromHudaStructureIds: new Set([3]),
      tarifsJournaliersCibles: [
        cibleTarif(2024, true, 30),
        cibleTarif(2024, false, 20),
        cibleTarif(2023, false, 1),
      ],
      tauxEncadrementCibles: [
        cibleTaux(2024, true, false, 12),
        cibleTaux(2024, false, false, 15),
        cibleTaux(2024, false, true, 21),
      ],
    };

    const year2024 = computeFinanceStatistiques(context, "moyenne").byYear[0];

    expect(year2024.total.coutJournalierCible).toBe(23.3);
    expect(year2024.total.tauxEncadrementCible).toBe(16);
  });

  it("ne renvoie pas de cible quand l'année est absente de la table", () => {
    const context = {
      ...buildFinanceContext({
        structures: [testStructure(1, StructureType.CADA)],
        budgets: [budgetRow(1, 1, 2024, 0, 0)],
      }),
      tarifsJournaliersCibles: [cibleTarif(2023, false, 20)],
    };

    const year2024 = computeFinanceStatistiques(context, "moyenne").byYear[0];

    expect(year2024.total.coutJournalierCible).toBeNull();
    expect(year2024.total.tauxEncadrementCible).toBeNull();
  });
});

describe("finance - structures actualisées", () => {
  it("ne comptabilise que les structures actualisées sur une année de campagne", () => {
    const context = {
      ...buildFinanceContext({
        structures: [
          testStructure(1, StructureType.CADA),
          testStructure(2, StructureType.CADA),
        ],
        budgets: [
          budgetRow(1, 1, 2024, 100, 0),
          budgetRow(2, 2, 2024, 100, 0),
          budgetRow(3, 1, 2026, 100, 0),
          budgetRow(4, 2, 2026, 100, 0),
        ],
      }),
      actualisationFormDefinitions: [
        { slug: "actualisation-2026", deadline: null },
      ],
      lastValidatedCampagneYearByStructureId: new Map([[1, 2026]]),
    };

    const result = computeFinanceStatistiques(context, "moyenne");
    const year2024 = result.byYear.find((entry) => entry.year === 2024);
    const year2026 = result.byYear.find((entry) => entry.year === 2026);

    expect(year2024?.completude).toBeNull();
    expect(year2024?.total.totalProduits).toBe(200);
    expect(year2026?.completude).toMatchObject({
      nbAttendues: 2,
      nbRenseignees: 1,
    });
    expect(year2026?.total.totalProduits).toBe(100);
  });
});

describe("finance - jours x places", () => {
  const context = {
    openingDateByStructureId: new Map([
      [1, new Date("2020-01-01T00:00:00.000Z")],
    ]),
    closureDateByStructureId: new Map<number, Date | null>(),
  };
  const now = new Date("2026-09-15T12:00:00.000Z");

  it("utilise le millésime de typologie avant le versionnement des places", () => {
    expect(computeStructureJoursPlaces(context, 1, 2025, [], 10, now)).toEqual({
      jours: 365,
      joursPlaces: 3650,
    });
  });

  it("découpe l'année selon les versions effectives de la structure", () => {
    const versions = buildTestStructureVersionTimeline([
      { structureId: 1, structureVersionId: 1, placesAutorisees: 100 },
      {
        structureId: 1,
        structureVersionId: 2,
        effectiveDate: new Date("2026-07-01T00:00:00.000Z"),
        placesAutorisees: 200,
      },
      {
        structureId: 1,
        structureVersionId: 3,
        effectiveDate: new Date("2026-11-01T00:00:00.000Z"),
        placesAutorisees: 999,
      },
    ]);

    expect(
      computeStructureJoursPlaces(context, 1, 2026, versions, null, now)
    ).toEqual({ jours: 365, joursPlaces: 181 * 100 + 184 * 200 });
  });

  it("borne l'année par les dates d'ouverture et de fermeture", () => {
    const boundedContext = {
      openingDateByStructureId: new Map([
        [1, new Date("2025-03-01T00:00:00.000Z")],
      ]),
      closureDateByStructureId: new Map<number, Date | null>([
        [1, new Date("2025-03-10T00:00:00.000Z")],
      ]),
    };

    expect(
      computeStructureJoursPlaces(boundedContext, 1, 2025, [], 10, now)
    ).toEqual({ jours: 10, joursPlaces: 100 });
    expect(
      computeStructureJoursPlaces(boundedContext, 1, 2026, [], 10, now)
    ).toBeNull();
  });
});
