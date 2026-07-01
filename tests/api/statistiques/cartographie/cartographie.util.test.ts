import { describe, expect, it } from "vitest";

import type { CartographieDbDepartement } from "@/app/api/statistiques/cartographie/cartographie.repository";
import {
  buildZoneDefinitions,
  computeEvolution,
  computeIndicateurValues,
  groupStructureIdsByDepartement,
  resolveZoneDepartementNumeros,
} from "@/app/api/statistiques/cartographie/cartographie.util";
import type {
  StatistiqueDbAdresse,
  StatistiqueDbBudget,
  StatistiqueDbCpomStructure,
  StatistiqueDbEig,
  StatistiqueDbStructure,
  StatistiqueDbTypologie,
} from "@/app/api/statistiques/statistiques.db.type";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { buildTestActivityIndex, buildTestStatistiquesContext } from "../test-helpers";

const testStructure = (
  id: number,
  departementAdministratif: string,
  type: StructureType = StructureType.CADA
): StatistiqueDbStructure => ({ id, type, departementAdministratif });

const testTypologie = (
  id: number,
  structureId: number,
  year: number,
  placesAutorisees: number,
  pmr = 0
): StatistiqueDbTypologie => ({
  id,
  structureId,
  year,
  placesAutorisees,
  pmr,
  lgbt: 0,
  fvvTeh: 0,
});

const testAdresse = (
  id: number,
  structureId: number,
  qpv: number
): StatistiqueDbAdresse => ({
  id,
  structureId,
  structureVersionId: structureId,
  repartition: Repartition.COLLECTIF,
  placesAutorisees: 0,
  qpv,
  logementSocial: 0,
});

describe("groupStructureIdsByDepartement", () => {
  it("regroupe les structures par departementAdministratif", () => {
    const groups = groupStructureIdsByDepartement([
      testStructure(1, "01"),
      testStructure(2, "01"),
      testStructure(3, "75"),
    ]);

    expect(groups.get("01")).toEqual(new Set([1, 2]));
    expect(groups.get("75")).toEqual(new Set([3]));
  });

  it("ignore les structures sans departementAdministratif", () => {
    const groups = groupStructureIdsByDepartement([
      { id: 1, type: StructureType.CADA, departementAdministratif: null },
    ]);

    expect(groups.size).toBe(0);
  });
});

describe("resolveZoneDepartementNumeros", () => {
  const allDepartements: CartographieDbDepartement[] = [
    { numero: "01", name: "Ain", population: 100, regionCode: "ARA", regionName: "Auvergne-Rhône-Alpes" },
    { numero: "75", name: "Paris", population: 100, regionCode: "IDF", regionName: "Île-de-France" },
    { numero: "92", name: "Hauts-de-Seine", population: 100, regionCode: "IDF", regionName: "Île-de-France" },
  ];

  it("ne restreint pas ('Toute la France') sans filtre departements ni regions", () => {
    expect(resolveZoneDepartementNumeros({ departements: null, regions: null }, allDepartements)).toBeNull();
  });

  it("restreint aux départements listés en CSV", () => {
    expect(
      resolveZoneDepartementNumeros({ departements: "01,75", regions: null }, allDepartements)
    ).toEqual(new Set(["01", "75"]));
  });

  it("résout une région en ses départements", () => {
    expect(
      resolveZoneDepartementNumeros({ departements: null, regions: "IDF" }, allDepartements)
    ).toEqual(new Set(["75", "92"]));
  });

  it("intersecte quand departements et regions sont fournis ensemble", () => {
    expect(
      resolveZoneDepartementNumeros(
        { departements: "01,75", regions: "IDF" },
        allDepartements
      )
    ).toEqual(new Set(["75"]));
  });

  it("retourne un Set vide pour un code région inconnu", () => {
    expect(
      resolveZoneDepartementNumeros({ departements: null, regions: "XX" }, allDepartements)
    ).toEqual(new Set());
  });
});

describe("buildZoneDefinitions", () => {
  const allDepartements: CartographieDbDepartement[] = [
    { numero: "01", name: "Ain", population: 100, regionCode: "ARA", regionName: "Auvergne-Rhône-Alpes" },
    { numero: "75", name: "Paris", population: 100, regionCode: "IDF", regionName: "Île-de-France" },
    { numero: "92", name: "Hauts-de-Seine", population: 100, regionCode: "IDF", regionName: "Île-de-France" },
  ];
  const allRegions = [
    { code: "ARA", name: "Auvergne-Rhône-Alpes" },
    { code: "IDF", name: "Île-de-France" },
    { code: "COR", name: "Corse" },
  ];

  it("découpage département : une zone par département, triée par code", () => {
    const zones = buildZoneDefinitions("departement", allDepartements, allRegions, null);

    expect(zones).toEqual([
      { code: "01", name: "Ain", departementNumeros: ["01"] },
      { code: "75", name: "Paris", departementNumeros: ["75"] },
      { code: "92", name: "Hauts-de-Seine", departementNumeros: ["92"] },
    ]);
  });

  it("découpage département restreint à une zone : ne retourne que les départements de la zone", () => {
    const zones = buildZoneDefinitions(
      "departement",
      allDepartements,
      allRegions,
      new Set(["75", "92"])
    );

    expect(zones.map((zone) => zone.code)).toEqual(["75", "92"]);
  });

  it("découpage région : regroupe les départements par région et inclut les régions sans département (sans restriction)", () => {
    const zones = buildZoneDefinitions("region", allDepartements, allRegions, null);

    expect(zones).toContainEqual({
      code: "IDF",
      name: "Île-de-France",
      departementNumeros: ["75", "92"],
    });
    expect(zones).toContainEqual({
      code: "ARA",
      name: "Auvergne-Rhône-Alpes",
      departementNumeros: ["01"],
    });
    // Corse has no departement in the fixture, but still appears unrestricted.
    expect(zones).toContainEqual({ code: "COR", name: "Corse", departementNumeros: [] });
  });

  it("découpage région restreint à une zone : ne complète pas avec les régions sans département de la restriction", () => {
    const zones = buildZoneDefinitions(
      "region",
      allDepartements,
      allRegions,
      new Set(["01"])
    );

    expect(zones).toEqual([
      { code: "ARA", name: "Auvergne-Rhône-Alpes", departementNumeros: ["01"] },
    ]);
  });
});

describe("computeEvolution", () => {
  it("détecte une hausse", () => {
    expect(computeEvolution(10, 8)).toEqual({
      previousValue: 8,
      delta: 2,
      direction: "hausse",
    });
  });

  it("détecte une baisse", () => {
    expect(computeEvolution(8, 10)).toEqual({
      previousValue: 10,
      delta: -2,
      direction: "baisse",
    });
  });

  it("détecte une stabilité", () => {
    expect(computeEvolution(5, 5)).toEqual({
      previousValue: 5,
      delta: 0,
      direction: "stable",
    });
  });

  it("retourne null si l'une des deux valeurs est absente", () => {
    expect(computeEvolution(null, 8)).toBeNull();
    expect(computeEvolution(8, null)).toBeNull();
    expect(computeEvolution(null, null)).toBeNull();
  });
});

describe("computeIndicateurValues - un seul indicateur calculé, pas le bloc entier", () => {
  it("structures.total : lit uniquement totalStructures par année, ignore les autres années", () => {
    const { activeStructureIdsNow, activeStructureIdsByPeriod } =
      buildTestActivityIndex([1], { typologieYears: [2024, 2025], referenceYear: 2025 });

    const context = buildTestStatistiquesContext({
      structures: [testStructure(1, "01")],
      allStructures: [testStructure(1, "01")],
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
      typologies: [testTypologie(1, 1, 2025, 10)],
      adresses: [],
      departements: [],
    });

    const result = computeIndicateurValues(context, "structures.total", 2025, "moyenne");

    expect(result.value).toBe(1);
    expect(result.previousValue).toBeNull(); // pas de typologie 2024
  });

  it("structures.avecCpom : compte les structures (pas les contrats) couvertes par un CPOM actif l'année", () => {
    const { activeStructureIdsNow, activeStructureIdsByPeriod } =
      buildTestActivityIndex([1, 2], { typologieYears: [2024], referenceYear: 2024 });

    const cpomLinks: StatistiqueDbCpomStructure[] = [1, 2].map((structureId) => ({
      id: structureId,
      cpomId: 100,
      structureId,
      dateStart: new Date("2024-01-01"),
      dateEnd: new Date("2024-12-31"),
      cpom: { actesAdministratifs: [] },
    }));

    const context = buildTestStatistiquesContext({
      structures: [testStructure(1, "01"), testStructure(2, "01")],
      allStructures: [testStructure(1, "01"), testStructure(2, "01")],
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
      typologies: [testTypologie(1, 1, 2024, 10), testTypologie(2, 2, 2024, 10)],
      adresses: [],
      departements: [],
      cpomLinks,
    });

    const result = computeIndicateurValues(context, "structures.avecCpom", 2024, "moyenne");

    expect(result.value).toBe(2); // 1 seul CPOM mais 2 structures couvertes
  });

  it("places.pmr : somme le champ pmr de la typologie pour l'année demandée", () => {
    const { activeStructureIdsNow, activeStructureIdsByPeriod } =
      buildTestActivityIndex([1], { typologieYears: [2024, 2025], referenceYear: 2025 });

    const context = buildTestStatistiquesContext({
      structures: [testStructure(1, "01")],
      allStructures: [testStructure(1, "01")],
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
      typologies: [
        testTypologie(1, 1, 2024, 10, 3),
        testTypologie(2, 1, 2025, 10, 5),
      ],
      adresses: [],
      departements: [],
    });

    const result = computeIndicateurValues(context, "places.pmr", 2025, "moyenne");

    expect(result.value).toBe(5);
    expect(result.previousValue).toBe(3);
  });

  it("places.qpv : reconstitue l'adresse effective au 31/12 de l'année demandée", () => {
    const { activeStructureIdsNow, activeStructureIdsByPeriod } =
      buildTestActivityIndex([1], { typologieYears: [2024], referenceYear: 2024 });

    const context = buildTestStatistiquesContext({
      structures: [testStructure(1, "01")],
      allStructures: [testStructure(1, "01")],
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
      typologies: [testTypologie(1, 1, 2024, 10)],
      adresses: [testAdresse(10, 1, 7)],
      departements: [],
    });

    const result = computeIndicateurValues(context, "places.qpv", 2024, "moyenne");

    expect(result.value).toBe(7);
  });

  it("finance.resultatNet : ne calcule que le scope total, pas autorisées/subventionnées", () => {
    const { activeStructureIdsNow, activeStructureIdsByPeriod } = buildTestActivityIndex(
      [1, 2],
      { financeYears: [2025] }
    );

    const budgets: StatistiqueDbBudget[] = [
      { id: 1, structureId: 1, year: 2025, dotationDemandee: 100, dotationAccordee: 90, totalProduits: 200, totalCharges: 150 },
      { id: 2, structureId: 2, year: 2025, dotationDemandee: 50, dotationAccordee: 40, totalProduits: 80, totalCharges: 100 },
    ];

    const context = buildTestStatistiquesContext({
      structures: [testStructure(1, "01"), testStructure(2, "01", StructureType.HUDA)],
      allStructures: [testStructure(1, "01"), testStructure(2, "01", StructureType.HUDA)],
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
      typologies: [],
      adresses: [],
      departements: [],
      budgets,
    });

    const result = computeIndicateurValues(context, "finance.resultatNet", 2025, "moyenne");

    // total scope only: (200-150) + (80-100) = 30
    expect(result.value).toBe(30);
  });

  it("controleQualite.nbEig : lit la série annuelle uniquement (pas mois/trimestre)", () => {
    const { activeStructureIdsNow, activeStructureIdsByPeriod } = buildTestActivityIndex([1], {
      periodDates: [new Date("2025-03-01"), new Date("2024-05-01")],
    });

    const eigs: StatistiqueDbEig[] = [
      { id: 1, dnaCode: "DNA01", type: "Autre", evenementDate: new Date("2025-03-01") },
      { id: 2, dnaCode: "DNA01", type: "Autre", evenementDate: new Date("2024-05-01") },
    ];

    const context = buildTestStatistiquesContext({
      structures: [testStructure(1, "01")],
      allStructures: [testStructure(1, "01")],
      activeStructureIdsNow,
      activeStructureIdsByPeriod,
      typologies: [],
      adresses: [],
      departements: [],
      eigs,
      dnaLinks: [{ id: 1, structureId: 1, structureVersionId: 1, dna: { code: "DNA01" } }],
    });

    const result = computeIndicateurValues(
      context,
      "controleQualite.nbEig",
      2025,
      "moyenne"
    );

    expect(result.value).toBe(1);
    expect(result.previousValue).toBe(1);
  });

  it("activite.* : pas d'évolution N-1 (previousValue toujours null), l'année n'a pas d'effet", () => {
    const context = buildTestStatistiquesContext({
      structures: [testStructure(1, "01")],
      allStructures: [testStructure(1, "01")],
      typologies: [],
      adresses: [],
      departements: [],
      dnaLinks: [{ id: 1, structureId: 1, structureVersionId: 1, dna: { code: "DNA01" } }],
      activites: [
        {
          id: 1,
          dnaCode: "DNA01",
          date: new Date("2025-03-01"),
          placesAutorisees: 100,
          desinsectisation: null,
          remiseEnEtat: null,
          sousOccupation: null,
          travaux: null,
          placesIndisponibles: 10,
          placesOccupees: 80,
          presencesInduesBPI: null,
          presencesInduesDeboutees: null,
        },
      ],
    });

    const resultFor2025 = computeIndicateurValues(context, "activite.placesOccupees", 2025, "moyenne");
    const resultFor2020 = computeIndicateurValues(context, "activite.placesOccupees", 2020, "moyenne");

    expect(resultFor2025.value).toBe(80);
    expect(resultFor2025.previousValue).toBeNull();
    expect(resultFor2020.value).toBe(80);
  });
});
