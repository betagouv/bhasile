import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CartographieDbDepartement } from "@/app/api/statistiques/cartographie/cartographie.repository";
import { getCartographieStatistiques } from "@/app/api/statistiques/cartographie/cartographie.service";
import type {
  StatistiqueDbStructure,
  StatistiquesContext,
} from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

import { buildTestActivityIndex } from "../test-helpers";

const mockBuildStatistiquesContext = vi.fn();
const mockFindAllDepartementsWithRegion = vi.fn();
const mockFindAllRegions = vi.fn();

vi.mock("@/app/api/statistiques/statistique.service", () => ({
  buildStatistiquesContext: (...args: unknown[]) =>
    mockBuildStatistiquesContext(...args),
}));

vi.mock("@/app/api/statistiques/cartographie/cartographie.repository", () => ({
  findAllDepartementsWithRegion: (...args: unknown[]) =>
    mockFindAllDepartementsWithRegion(...args),
  findAllRegions: (...args: unknown[]) => mockFindAllRegions(...args),
}));

const testStructure = (
  id: number,
  departementAdministratif: string
): StatistiqueDbStructure => ({
  id,
  type: StructureType.CADA,
  departementAdministratif,
});

const ALL_DEPARTEMENTS: CartographieDbDepartement[] = [
  {
    numero: "01",
    name: "Ain",
    population: 100,
    regionCode: "ARA",
    regionName: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "38",
    name: "Isère",
    population: 100,
    regionCode: "ARA",
    regionName: "Auvergne-Rhône-Alpes",
  },
  {
    numero: "75",
    name: "Paris",
    population: 100,
    regionCode: "IDF",
    regionName: "Île-de-France",
  },
];

const buildContext = (
  structures: StatistiqueDbStructure[]
): StatistiquesContext => {
  const { activeStructureIdsNow, activeStructureIdsByPeriod } =
    buildTestActivityIndex(
      structures.map((structure) => structure.id),
      { typologieYears: [2025], referenceYear: 2025 }
    );

  return {
    structures,
    allStructures: structures,
    activeStructureIdsNow,
    activeStructureIdsByPeriod,
    eigs: [],
    evaluations: [],
    typologies: structures.map((structure) => ({
      id: structure.id,
      structureId: structure.id,
      year: 2025,
      placesAutorisees: 10,
      pmr: 0,
      lgbt: 0,
      fvvTeh: 0,
    })),
    adresses: [],
    cpomLinks: [],
    dnaLinks: [],
    structureVersionTimeline: structures.map((structure) => ({
      id: structure.id,
      structureId: structure.id,
      effectiveDate: new Date("2000-01-01"),
      type: structure.type,
      departementAdministratif: structure.departementAdministratif,
    })),
    departements: [],
    budgets: [],
    indicateurs: [],
    activites: [],
  };
};

describe("getCartographieStatistiques", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindAllDepartementsWithRegion.mockResolvedValue(ALL_DEPARTEMENTS);
    mockFindAllRegions.mockResolvedValue([
      { code: "ARA", name: "Auvergne-Rhône-Alpes" },
      { code: "IDF", name: "Île-de-France" },
    ]);
  });

  it("découpage département : une valeur par département, null pour un département sans structure", async () => {
    mockBuildStatistiquesContext.mockResolvedValue(
      buildContext([testStructure(1, "01"), testStructure(2, "75")])
    );

    const result = await getCartographieStatistiques({
      granularite: "departement",
      indicateur: "places.autorisees",
      annee: 2025,
      departements: null,
      regions: null,
      operateurs: null,
      types: null,
      aggregation: "moyenne",
    });

    expect(result.zones).toContainEqual(
      expect.objectContaining({ code: "01", value: 10 })
    );
    expect(result.zones).toContainEqual(
      expect.objectContaining({ code: "75", value: 10 })
    );
    // "38" has no structure: included with null value.
    expect(result.zones).toContainEqual(
      expect.objectContaining({ code: "38", value: null, evolution: null })
    );
  });

  it("découpage région : agrège les départements d'une même région (01 + 38 = ARA)", async () => {
    mockBuildStatistiquesContext.mockResolvedValue(
      buildContext([testStructure(1, "01"), testStructure(2, "38")])
    );

    const result = await getCartographieStatistiques({
      granularite: "region",
      indicateur: "places.autorisees",
      annee: 2025,
      departements: null,
      regions: null,
      operateurs: null,
      types: null,
      aggregation: "moyenne",
    });

    expect(result.zones).toContainEqual(
      expect.objectContaining({ code: "ARA", value: 20 })
    );
    expect(result.zones).toContainEqual(
      expect.objectContaining({ code: "IDF", value: null })
    );
  });

  it("restreint la zone (regions=ARA) : ne retourne que les départements de la région, et propage la restriction au contexte", async () => {
    mockBuildStatistiquesContext.mockResolvedValue(
      buildContext([testStructure(1, "01")])
    );

    const result = await getCartographieStatistiques({
      granularite: "departement",
      indicateur: "places.autorisees",
      annee: 2025,
      departements: null,
      regions: "ARA",
      operateurs: null,
      types: null,
      aggregation: "moyenne",
    });

    expect(result.zones.map((zone) => zone.code).sort()).toEqual(["01", "38"]);
    expect(mockBuildStatistiquesContext).toHaveBeenCalledWith(
      expect.objectContaining({ departements: expect.stringMatching(/^(01,38|38,01)$/) })
    );
  });

  it("code région inconnu : ne retourne aucune zone et n'appelle pas buildStatistiquesContext (pas de round-trip inutile)", async () => {
    const result = await getCartographieStatistiques({
      granularite: "region",
      indicateur: "places.autorisees",
      annee: 2025,
      departements: null,
      regions: "XX",
      operateurs: null,
      types: null,
      aggregation: "moyenne",
    });

    expect(result.zones).toEqual([]);
    expect(mockBuildStatistiquesContext).not.toHaveBeenCalled();
  });

  it("aucune structure dans tout le périmètre (buildStatistiquesContext -> null) : toutes les zones à value null", async () => {
    mockBuildStatistiquesContext.mockResolvedValue(null);

    const result = await getCartographieStatistiques({
      granularite: "departement",
      indicateur: "places.autorisees",
      annee: 2025,
      departements: null,
      regions: null,
      operateurs: null,
      types: "CAES",
      aggregation: "moyenne",
    });

    expect(result.zones).toHaveLength(3);
    expect(result.zones.every((zone) => zone.value === null)).toBe(true);
  });
});
