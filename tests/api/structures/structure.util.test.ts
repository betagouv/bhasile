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
  getReadableAdresses,
  getReadableNotes,
  isBornFromCreation,
  sortStructureRows,
  StructureListComputedRow,
} from "@/app/api/structures/structure.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { Repartition } from "@/types/adresse.type";
import { SessionUser } from "@/types/global";
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

describe("dates de structure issues des actes administratifs", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retourne les dates de convention et d'autorisation via les wrappers dédiés", () => {
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

const now = new Date("2026-06-24T00:00:00.000Z");

describe("computeStructureListRow", () => {
  it("retourne null quand aucune version courante n'est résolue", () => {
    expect(computeStructureListRow(buildLightStructure(), undefined, now)).toBe(
      null
    );
  });

  it("déduit le bâti MIXTE, les dernières places et les valeurs de recherche", () => {
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

  it("considère les adresses stockées en MIXTE (ou tout mélange) comme bâti MIXTE", () => {
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

  it("calcule finConvention depuis l'acte de convention courant, pas depuis un scalaire", () => {
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

  it("expose les dernières places non nulles pour les bornes même quand l'année la plus récente est nulle", () => {
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

  it("marque une fermeture finalisée comme fermée avec sa date et son motif", () => {
    // GIVEN
    const version = fermetureVersion();

    // WHEN
    const row = computeStructureListRow(
      buildLightStructure({}, version),
      version,
      now
    );

    // THEN
    expect(row?.isClosed).toBe(true);
    expect(row?.fermetureDate).toEqual(new Date("2025-03-10T00:00:00.000Z"));
    expect(row?.fermetureMotif).toBe("Fin de prise en charge");
  });

  it("laisse une version courante non-fermeture ouverte avec date et motif null", () => {
    // GIVEN
    const version = buildVersion();

    // WHEN
    const row = computeStructureListRow(
      buildLightStructure({}, version),
      version,
      now
    );

    // THEN
    expect(row?.isClosed).toBe(false);
    expect(row?.fermetureDate).toBe(null);
    expect(row?.fermetureMotif).toBe(null);
  });

  it("reste fermée quand la fermeture est la dernière version valide", () => {
    // GIVEN
    const versions = [buildVersion(), fermetureVersion()];
    const structure = buildLightStructure({ structureVersions: versions });

    // WHEN
    const current = resolveCurrentVersion(structure.structureVersions, now);

    // THEN
    expect(computeStructureListRow(structure, current, now)?.isClosed).toBe(
      true
    );
  });

  it("est de nouveau ouverte quand une version valide ultérieure remplace la fermeture", () => {
    // GIVEN
    const reopen = buildVersion({
      id: 30,
      effectiveDate: new Date("2025-09-01T00:00:00.000Z"),
      structureVersionTransformationId: null,
      structureVersionTransformation: null,
    });
    const versions = [fermetureVersion(), reopen];
    const structure = buildLightStructure({ structureVersions: versions });

    // WHEN
    const current = resolveCurrentVersion(structure.structureVersions, now);

    // THEN
    expect(computeStructureListRow(structure, current, now)?.isClosed).toBe(
      false
    );
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

  it("est vrai pour une CREATION validée prenant effet dans le passé", () => {
    expect(isBornFromCreation([creationVersion()], now)).toBe(true);
  });

  it("est faux quand le formulaire de création n'est pas validé", () => {
    const version = creationVersion({
      structureVersionTransformation: {
        type: StructureVersionTransformationType.CREATION,
        transformation: { form: { status: false } },
      } as unknown as StructureListLightVersion["structureVersionTransformation"],
    });
    expect(isBornFromCreation([version], now)).toBe(false);
  });

  it("est faux quand la création prend effet dans le futur", () => {
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
  it("masque les lignes non visibles sauf si includeNonVisible est activé", () => {
    const hidden = buildRow({ hasForm: false, bornFromCreation: false });

    expect(
      filterStructureRows([hidden], emptyFilters, { includeNonVisible: false })
    ).toHaveLength(0);
    expect(
      filterStructureRows([hidden], emptyFilters, { includeNonVisible: true })
    ).toHaveLength(1);
  });

  it("filtre la recherche sans tenir compte des accents", () => {
    const row = buildRow({ searchValues: ["Créteil"] });

    expect(
      filterStructureRows(
        [row],
        { ...emptyFilters, search: "creteil" },
        { includeNonVisible: false }
      )
    ).toHaveLength(1);
  });

  it("filtre sur le type, l'intervalle de places et le bâti", () => {
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

  it("restreint aux lignes finalisées quand c'est demandé", () => {
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

  it("ne garde que les lignes fermées quand isClosed vaut true", () => {
    // GIVEN
    const rows = [
      buildRow({ id: 1, isClosed: false }),
      buildRow({ id: 2, isClosed: true }),
    ];

    // WHEN
    const filtered = filterStructureRows(
      rows,
      { ...emptyFilters, isClosed: true },
      { includeNonVisible: false }
    );

    // THEN
    expect(filtered.map((row) => row.id)).toEqual([2]);
  });

  it("ne garde que les lignes ouvertes quand isClosed vaut false ou absent", () => {
    // GIVEN
    const rows = [
      buildRow({ id: 1, isClosed: false }),
      buildRow({ id: 2, isClosed: true }),
    ];

    // WHEN / THEN
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

describe("sortStructureRows", () => {
  it("trie les types enum par ordre alphabétique (et non plus par ordre de déclaration)", () => {
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

  it("place les valeurs nulles en dernier en asc et en premier en desc", () => {
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

  it("départage les égalités sur codeBhasile puis id", () => {
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

describe("getFermetureHistory", () => {
  it("construit un unique évènement FERMETURE pour une ligne fermée", () => {
    // GIVEN
    const row = buildRow({
      isClosed: true,
      fermetureDate: new Date("2025-03-10T00:00:00.000Z"),
      fermetureMotif: "Fin de prise en charge",
    });

    // WHEN
    const history = getFermetureHistory(row);

    // THEN
    expect(history).toEqual([
      {
        kind: "FERMETURE",
        date: "2025-03-10T00:00:00.000Z",
        motif: "Fin de prise en charge",
        targets: [],
      },
    ]);
  });

  it("ne retourne aucun évènement pour une ligne ouverte", () => {
    // GIVEN
    const row = buildRow({ isClosed: false });

    // WHEN / THEN
    expect(getFermetureHistory(row)).toEqual([]);
  });
});

describe("getReadableNotes", () => {
  const structureParis = {
    departementAdministratif: "75",
    notes: "Note 1",
  } as StructureApiRead;

  it("renvoie les notes à un agent qui peut éditer la structure de son département", () => {
    const agentParis = {
      id: "agent-paris",
      role: "DEPARTEMENT_PARIS",
      allowedDepartements: ["75"],
    } as SessionUser;

    expect(getReadableNotes(structureParis, agentParis)).toBe("Note 1");
  });

  it("renvoie les notes à un agent NATIONAL", () => {
    const agentNational = {
      id: "agent-national",
      role: "NATIONAL",
      allowedDepartements: [] as string[],
    } as SessionUser;

    expect(getReadableNotes(structureParis, agentNational)).toBe("Note 1");
  });

  it("masque les notes à un agent d'un autre département", () => {
    const agentRhone = {
      id: "agent-rhone",
      role: "DEPARTEMENT_RHONE",
      allowedDepartements: ["69"],
    } as SessionUser;

    expect(getReadableNotes(structureParis, agentRhone)).toBeNull();
  });

  it("masque les notes à un utilisateur non authentifié", () => {
    expect(getReadableNotes(structureParis, undefined)).toBeNull();
  });
});

describe("getReadableAdresses", () => {
  const buildStructure = (
    adresse: Record<string, unknown>
  ): StructureApiRead =>
    ({
      departementAdministratif: "75",
      adresses: [adresse],
    }) as unknown as StructureApiRead;

  const adresseComplete = {
    id: 1,
    adresse: "12 rue Secrète",
    codePostal: "75011",
    commune: "Paris",
    adresseComplete: "12 rue Secrète, 75011 Paris",
  };

  const agentParis = {
    id: "agent-paris",
    role: "DEPARTEMENT_PARIS",
    allowedDepartements: ["75"],
  } as SessionUser;

  const agentRhone = {
    id: "agent-rhone",
    role: "DEPARTEMENT_RHONE",
    allowedDepartements: ["69"],
  } as SessionUser;

  it("renvoie l'adresse exacte à un agent qui peut éditer la structure", () => {
    const structure = buildStructure(adresseComplete);

    expect(getReadableAdresses(structure, agentParis)).toEqual([
      adresseComplete,
    ]);
  });

  it("masque la rue mais conserve code postal et commune pour un agent d'un autre département", () => {
    const structure = buildStructure(adresseComplete);

    expect(getReadableAdresses(structure, agentRhone)).toEqual([
      { ...adresseComplete, adresse: "", adresseComplete: "75011 Paris" },
    ]);
  });

  it("masque la rue pour un utilisateur non authentifié", () => {
    const structure = buildStructure(adresseComplete);

    expect(getReadableAdresses(structure, undefined)).toEqual([
      { ...adresseComplete, adresse: "", adresseComplete: "75011 Paris" },
    ]);
  });

  it("ignore les composantes vides en reconstruisant l'adresse masquée", () => {
    const structure = buildStructure({
      id: 2,
      adresse: "3 impasse Cachée",
      codePostal: "69001",
      commune: null,
      adresseComplete: "3 impasse Cachée, 69001",
    });

    expect(getReadableAdresses(structure, agentRhone)).toEqual([
      {
        id: 2,
        adresse: "",
        codePostal: "69001",
        commune: null,
        adresseComplete: "69001",
      },
    ]);
  });
});
