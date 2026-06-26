import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveCurrentVersion } from "@/app/api/structure-versions/structure-version.util";
import {
  StructureDbList,
  StructureListLight,
  StructureListLightVersion,
} from "@/app/api/structures/structure.db.type";
import { SearchProps } from "@/app/api/structures/structure.service";
import {
  computeStructureListRow,
  filterStructureRows,
  getDatesConvention,
  getDatesPeriodeAutorisation,
  getFermetureHistory,
  isBornFromCreation,
  sortStructureRows,
  StructureListComputedRow,
} from "@/app/api/structures/structure.util";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";
import { StructureVersionTransformationType } from "@/types/transformation.type";

type ActeAdministratifStub = {
  id?: number;
  parentId?: number | null;
  category?: "CONVENTION" | "ARRETE_AUTORISATION" | "AUTRE";
  startDate?: Date | null;
  endDate?: Date | null;
};

const createStructure = (
  actesAdministratifs: ActeAdministratifStub[]
): StructureDbList =>
  ({
    actesAdministratifs,
  }) as unknown as StructureDbList;

describe("structure dates from actes administratifs", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns convention and autorisation dates through dedicated wrappers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    const structure = createStructure([
      {
        id: 201,
        category: "CONVENTION",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: 202,
        category: "ARRETE_AUTORISATION",
        startDate: new Date("2024-01-01T00:00:00.000Z"),
        endDate: new Date("2027-01-01T00:00:00.000Z"),
      },
    ]);

    expect(getDatesConvention(structure)).toEqual([
      new Date("2025-01-01T00:00:00.000Z"),
      new Date("2026-02-01T00:00:00.000Z"),
    ]);
    expect(getDatesPeriodeAutorisation(structure)).toEqual([
      new Date("2024-01-01T00:00:00.000Z"),
      new Date("2027-01-01T00:00:00.000Z"),
    ]);
  });
});

const buildVersion = (
  overrides: Partial<StructureListLightVersion> = {}
): StructureListLightVersion =>
  ({
    id: 10,
    effectiveDate: new Date("2024-01-01T00:00:00.000Z"),
    structureVersionTransformationId: null,
    type: StructureType.CADA,
    nom: "Centre",
    departementAdministratif: "75",
    communeAdministrative: "Paris",
    codePostalAdministratif: "75001",
    latitude: null,
    longitude: null,
    structureVersionTransformation: null,
    adresses: [{ repartition: Repartition.COLLECTIF }],
    structureTypologies: [{ year: 2024, placesAutorisees: 30 }],
    dnaStructures: [{ dna: { code: "DNA-1" } }],
    structureFinesses: [{ finess: { code: "FIN-1" } }],
    ...overrides,
  }) as unknown as StructureListLightVersion;

const buildLightStructure = (
  overrides: Partial<StructureListLight> = {},
  version: StructureListLightVersion = buildVersion()
): StructureListLight =>
  ({
    id: 1,
    codeBhasile: "A-001",
    operateur: { name: "Operateur Alpha" },
    forms: [],
    actesAdministratifs: [],
    structureVersions: [version],
    ...overrides,
  }) as unknown as StructureListLight;

const now = new Date("2026-06-24T00:00:00.000Z");

describe("computeStructureListRow", () => {
  it("returns null when no current version is resolved", () => {
    expect(computeStructureListRow(buildLightStructure(), undefined, now)).toBe(
      null
    );
  });

  it("derives bati MIXTE, latest places and search values", () => {
    const version = buildVersion({
      adresses: [
        { repartition: Repartition.COLLECTIF },
        { repartition: Repartition.DIFFUS },
      ] as unknown as StructureListLightVersion["adresses"],
      structureTypologies: [
        { year: 2025, placesAutorisees: 42 },
        { year: 2024, placesAutorisees: 30 },
      ] as unknown as StructureListLightVersion["structureTypologies"],
    });
    const row = computeStructureListRow(
      buildLightStructure({}, version),
      version,
      now
    );

    expect(row?.bati).toBe(Repartition.MIXTE);
    expect(row?.placesAutorisees).toBe(42);
    expect(row?.searchValues).toEqual(
      expect.arrayContaining(["A-001", "Operateur Alpha", "DNA-1", "FIN-1"])
    );
  });

  it("treats addresses stored as MIXTE (or any mix) as bati MIXTE", () => {
    const allMixte = buildVersion({
      adresses: [
        { repartition: Repartition.MIXTE },
      ] as unknown as StructureListLightVersion["adresses"],
    });
    expect(
      computeStructureListRow(buildLightStructure({}, allMixte), allMixte, now)
        ?.bati
    ).toBe(Repartition.MIXTE);

    const collectifPlusMixte = buildVersion({
      adresses: [
        { repartition: Repartition.COLLECTIF },
        { repartition: Repartition.MIXTE },
      ] as unknown as StructureListLightVersion["adresses"],
    });
    expect(
      computeStructureListRow(
        buildLightStructure({}, collectifPlusMixte),
        collectifPlusMixte,
        now
      )?.bati
    ).toBe(Repartition.MIXTE);
  });

  it("computes finConvention from the current convention acte, not a scalar", () => {
    const structure = buildLightStructure({
      actesAdministratifs: [
        {
          id: 1,
          category: "CONVENTION",
          parentId: null,
          startDate: new Date("2024-01-01T00:00:00.000Z"),
          endDate: new Date("2027-12-31T00:00:00.000Z"),
        },
      ],
    } as unknown as Partial<StructureListLight>);

    const row = computeStructureListRow(structure, buildVersion(), now);

    expect(row?.finConvention).toEqual(new Date("2027-12-31T00:00:00.000Z"));
  });

  it("exposes the latest non-null places for bounds even when the newest year is null", () => {
    const version = buildVersion({
      structureTypologies: [
        { year: 2025, placesAutorisees: null },
        { year: 2024, placesAutorisees: 30 },
      ] as unknown as StructureListLightVersion["structureTypologies"],
    });
    const row = computeStructureListRow(
      buildLightStructure({}, version),
      version,
      now
    );

    expect(row?.placesAutorisees).toBe(null);
    expect(row?.latestNonNullPlacesAutorisees).toBe(30);
  });
});

describe("isBornFromCreation", () => {
  const creationVersion = (
    overrides: Partial<StructureListLightVersion> = {}
  ) =>
    buildVersion({
      structureVersionTransformationId: 5,
      structureVersionTransformation: {
        type: StructureVersionTransformationType.CREATION,
        transformation: { form: { status: true } },
      } as unknown as StructureListLightVersion["structureVersionTransformation"],
      ...overrides,
    });

  it("is true for a validated CREATION effective in the past", () => {
    expect(isBornFromCreation([creationVersion()], now)).toBe(true);
  });

  it("is false when the creation form is not validated", () => {
    const version = creationVersion({
      structureVersionTransformation: {
        type: StructureVersionTransformationType.CREATION,
        transformation: { form: { status: false } },
      } as unknown as StructureListLightVersion["structureVersionTransformation"],
    });
    expect(isBornFromCreation([version], now)).toBe(false);
  });

  it("is false when the creation is effective in the future", () => {
    const version = creationVersion({
      effectiveDate: new Date("2099-01-01T00:00:00.000Z"),
    });
    expect(isBornFromCreation([version], now)).toBe(false);
  });
});

const buildRow = (
  overrides: Partial<StructureListComputedRow> = {}
): StructureListComputedRow => ({
  id: 1,
  codeBhasile: "A-001",
  currentVersionId: 10,
  bornFromCreation: false,
  hasForm: true,
  finalised: false,
  type: StructureType.CADA,
  operateurName: "Operateur Alpha",
  departementAdministratif: "75",
  communeAdministrative: "Paris",
  bati: Repartition.COLLECTIF,
  placesAutorisees: 10,
  latestNonNullPlacesAutorisees: 10,
  finConvention: null,
  latitude: null,
  longitude: null,
  searchValues: ["A-001"],
  isClosed: false,
  fermetureDate: null,
  fermetureMotif: null,
  ...overrides,
});

const emptyFilters: SearchProps = {
  search: null,
  page: null,
  type: null,
  bati: null,
  placesAutorisees: null,
  departements: null,
  operateurs: null,
};

describe("filterStructureRows", () => {
  it("hides non-visible rows unless includeNonVisible is set", () => {
    const hidden = buildRow({ hasForm: false, bornFromCreation: false });

    expect(
      filterStructureRows([hidden], emptyFilters, { includeNonVisible: false })
    ).toHaveLength(0);
    expect(
      filterStructureRows([hidden], emptyFilters, { includeNonVisible: true })
    ).toHaveLength(1);
  });

  it("matches search accent-insensitively", () => {
    const row = buildRow({ searchValues: ["Créteil"] });

    expect(
      filterStructureRows(
        [row],
        { ...emptyFilters, search: "creteil" },
        { includeNonVisible: false }
      )
    ).toHaveLength(1);
  });

  it("filters on type, places range and bati", () => {
    const rows = [
      buildRow({ id: 1, type: StructureType.CADA, placesAutorisees: 10 }),
      buildRow({ id: 2, type: StructureType.HUDA, placesAutorisees: 100 }),
    ];

    expect(
      filterStructureRows(
        rows,
        { ...emptyFilters, type: "CADA" },
        { includeNonVisible: false }
      )
    ).toHaveLength(1);
    expect(
      filterStructureRows(
        rows,
        { ...emptyFilters, placesAutorisees: "0,50" },
        { includeNonVisible: false }
      )
    ).toHaveLength(1);
    expect(
      filterStructureRows(
        rows,
        { ...emptyFilters, bati: "diffus" },
        { includeNonVisible: false }
      )
    ).toHaveLength(0);
  });

  it("restricts to finalised rows when requested", () => {
    const rows = [
      buildRow({ id: 1, finalised: true }),
      buildRow({ id: 2, finalised: false }),
    ];

    expect(
      filterStructureRows(
        rows,
        { ...emptyFilters, finalised: true },
        { includeNonVisible: false }
      )
    ).toHaveLength(1);
  });
});

describe("sortStructureRows", () => {
  it("sorts enum types alphabetically (no longer by declaration order)", () => {
    const rows = [
      buildRow({ id: 1, codeBhasile: "A", type: StructureType.HUDA }),
      buildRow({ id: 2, codeBhasile: "B", type: StructureType.CADA }),
      buildRow({ id: 3, codeBhasile: "C", type: StructureType.CAES }),
    ];

    const sorted = sortStructureRows(rows, "type", "asc");

    expect(sorted.map((row) => row.type)).toEqual([
      StructureType.CADA,
      StructureType.CAES,
      StructureType.HUDA,
    ]);
  });

  it("places nulls last on asc and first on desc", () => {
    const rows = [
      buildRow({ id: 1, codeBhasile: "A", placesAutorisees: 10 }),
      buildRow({ id: 2, codeBhasile: "B", placesAutorisees: null }),
      buildRow({ id: 3, codeBhasile: "C", placesAutorisees: 5 }),
    ];

    expect(
      sortStructureRows(rows, "placesAutorisees", "asc").map(
        (row) => row.placesAutorisees
      )
    ).toEqual([5, 10, null]);
    expect(
      sortStructureRows(rows, "placesAutorisees", "desc").map(
        (row) => row.placesAutorisees
      )
    ).toEqual([null, 10, 5]);
  });

  it("breaks ties on codeBhasile then id", () => {
    const rows = [
      buildRow({ id: 2, codeBhasile: "B", departementAdministratif: "75" }),
      buildRow({ id: 1, codeBhasile: "A", departementAdministratif: "75" }),
    ];

    expect(
      sortStructureRows(rows, "departementAdministratif", "asc").map(
        (row) => row.codeBhasile
      )
    ).toEqual(["A", "B"]);
  });
});

const fermetureVersion = (overrides: Partial<StructureListLightVersion> = {}) =>
  buildVersion({
    id: 20,
    effectiveDate: new Date("2025-03-10T00:00:00.000Z"),
    structureVersionTransformationId: 7,
    structureVersionTransformation: {
      type: StructureVersionTransformationType.FERMETURE,
      motif: "Fin de prise en charge",
      transformation: { form: { status: true } },
    } as unknown as StructureListLightVersion["structureVersionTransformation"],
    ...overrides,
  });

describe("computeStructureListRow closure derivation", () => {
  it("flags a finalised fermeture as closed with its date and motif", () => {
    const version = fermetureVersion();
    const row = computeStructureListRow(
      buildLightStructure({}, version),
      version,
      now
    );

    expect(row?.isClosed).toBe(true);
    expect(row?.fermetureDate).toEqual(new Date("2025-03-10T00:00:00.000Z"));
    expect(row?.fermetureMotif).toBe("Fin de prise en charge");
  });

  it("leaves a non-fermeture current version open with null date and motif", () => {
    const version = buildVersion();
    const row = computeStructureListRow(
      buildLightStructure({}, version),
      version,
      now
    );

    expect(row?.isClosed).toBe(false);
    expect(row?.fermetureDate).toBe(null);
    expect(row?.fermetureMotif).toBe(null);
  });
});

describe("filterStructureRows closed toggle", () => {
  const rows = [
    buildRow({ id: 1, isClosed: false }),
    buildRow({ id: 2, isClosed: true }),
  ];

  it("keeps only closed rows when isClosed is true", () => {
    const filtered = filterStructureRows(
      rows,
      { ...emptyFilters, isClosed: true },
      { includeNonVisible: false }
    );
    expect(filtered.map((row) => row.id)).toEqual([2]);
  });

  it("keeps only open rows when isClosed is false or absent", () => {
    expect(
      filterStructureRows(
        rows,
        { ...emptyFilters, isClosed: false },
        { includeNonVisible: false }
      ).map((row) => row.id)
    ).toEqual([1]);
    expect(
      filterStructureRows(rows, emptyFilters, {
        includeNonVisible: false,
      }).map((row) => row.id)
    ).toEqual([1]);
  });
});

describe("getFermetureHistory", () => {
  it("builds a single FERMETURE event for a closed row", () => {
    const row = buildRow({
      isClosed: true,
      fermetureDate: new Date("2025-03-10T00:00:00.000Z"),
      fermetureMotif: "Fin de prise en charge",
    });

    expect(getFermetureHistory(row)).toEqual([
      {
        kind: "FERMETURE",
        date: "2025-03-10T00:00:00.000Z",
        motif: "Fin de prise en charge",
        targets: [],
      },
    ]);
  });

  it("returns no events for an open row", () => {
    expect(getFermetureHistory(buildRow({ isClosed: false }))).toEqual([]);
  });
});

describe("closed means currently-closed, not ever-closed", () => {
  it("is closed when the fermeture is the latest valid version", () => {
    const versions = [buildVersion(), fermetureVersion()];
    const structure = buildLightStructure({ structureVersions: versions });
    const current = resolveCurrentVersion(structure.structureVersions, now);

    expect(computeStructureListRow(structure, current, now)?.isClosed).toBe(
      true
    );
  });

  it("is open again when a later valid version supersedes the fermeture", () => {
    const reopen = buildVersion({
      id: 30,
      effectiveDate: new Date("2025-09-01T00:00:00.000Z"),
      structureVersionTransformationId: null,
      structureVersionTransformation: null,
    });
    const versions = [fermetureVersion(), reopen];
    const structure = buildLightStructure({ structureVersions: versions });
    const current = resolveCurrentVersion(structure.structureVersions, now);

    expect(computeStructureListRow(structure, current, now)?.isClosed).toBe(
      false
    );
  });
});
