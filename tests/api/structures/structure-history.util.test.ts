import { afterEach, describe, expect, it, vi } from "vitest";

import { StructureDbDetails } from "@/app/api/structures/structure.db.type";
import { buildStructureHistory } from "@/app/api/structures/structure.util";
import { CpomStructureApiRead } from "@/schemas/api/cpom.schema";
import { StructureVersionTransformationType } from "@/types/transformation.type";

type SiblingStub = {
  id: number;
  type: StructureVersionTransformationType;
  structureVersion: { structure: { id: number; codeBhasile: string } } | null;
};

type VersionStub = {
  effectiveDate: Date;
  structureVersionTransformationId?: number | null;
  structureVersionTransformation: {
    id: number;
    type: StructureVersionTransformationType;
    motif: string | null;
    transformation: {
      form: { status: boolean } | null;
      structureVersionTransformations: SiblingStub[];
    };
  } | null;
};

const makeStructure = (overrides: {
  creationDate?: Date | null;
  date303?: Date | null;
  structureVersions?: VersionStub[];
}): StructureDbDetails =>
  ({
    creationDate: overrides.creationDate ?? null,
    date303: overrides.date303 ?? null,
    structureVersions: overrides.structureVersions ?? [],
  }) as unknown as StructureDbDetails;

const makeCpomStructure = (overrides: {
  dateStart?: string | null;
  dateEnd?: string | null;
  conventionStart?: string;
  conventionEnd?: string;
  departements?: string[];
  operateurName?: string;
  cpomId?: number;
}): CpomStructureApiRead =>
  ({
    dateStart: overrides.dateStart ?? null,
    dateEnd: overrides.dateEnd ?? null,
    cpom: {
      id: overrides.cpomId ?? 7,
      dateStart: overrides.conventionStart,
      dateEnd: overrides.conventionEnd,
      operateur: { name: overrides.operateurName ?? "Coallia" },
      departements: (overrides.departements ?? []).map((numero) => ({
        departement: { numero },
      })),
    },
  }) as unknown as CpomStructureApiRead;

const makeRef = (id: number): SiblingStub["structureVersion"] => ({
  structure: { id, codeBhasile: `BHA-NOR-${id}` },
});

const finalizedTransformation = (
  ownTransformation: {
    id: number;
    type: StructureVersionTransformationType;
    motif?: string | null;
  },
  siblings: SiblingStub[] = []
): VersionStub["structureVersionTransformation"] => {
  const ownSibling: SiblingStub = {
    id: ownTransformation.id,
    type: ownTransformation.type,
    structureVersion: null,
  };
  return {
    id: ownTransformation.id,
    type: ownTransformation.type,
    motif: ownTransformation.motif ?? null,
    transformation: {
      form: { status: true },
      structureVersionTransformations: [ownSibling, ...siblings],
    },
  };
};

describe("buildStructureHistory — jalon création", () => {
  it("synthétise la création depuis creationDate pour une structure legacy (sans transformation)", () => {
    const structure = makeStructure({
      creationDate: new Date("2014-10-09T00:00:00.000Z"),
      structureVersions: [
        {
          effectiveDate: new Date("2026-05-21T00:00:00.000Z"),
          structureVersionTransformationId: null,
          structureVersionTransformation: null,
        },
      ],
    });

    const history = buildStructureHistory(structure, []);

    expect(history).toEqual([
      {
        kind: "CREATION",
        date: "2014-10-09T00:00:00.000Z",
        sources: [],
      },
    ]);
  });

  it("retombe sur l'effectiveDate de la version baseline quand creationDate et date303 sont absents", () => {
    const structure = makeStructure({
      creationDate: null,
      date303: null,
      structureVersions: [
        {
          effectiveDate: new Date("2015-03-10T00:00:00.000Z"),
          structureVersionTransformationId: null,
          structureVersionTransformation: null,
        },
      ],
    });

    const history = buildStructureHistory(structure, []);

    expect(history).toEqual([
      {
        kind: "CREATION",
        date: "2015-03-10T00:00:00.000Z",
        sources: [],
      },
    ]);
  });

  it("utilise l'effectiveDate de la transformation CREATION pour une structure moderne ex-nihilo", () => {
    const structure = makeStructure({
      creationDate: new Date("2099-01-01T00:00:00.000Z"),
      structureVersions: [
        {
          effectiveDate: new Date("2020-03-01T00:00:00.000Z"),
          structureVersionTransformation: finalizedTransformation({
            id: 1,
            type: StructureVersionTransformationType.CREATION,
          }),
        },
      ],
    });

    const history = buildStructureHistory(structure, []);

    expect(history).toEqual([
      {
        kind: "CREATION",
        date: "2020-03-01T00:00:00.000Z",
        sources: [],
      },
    ]);
  });

  it("expose les structures sources d'une création depuis une ou plusieurs structures", () => {
    const structure = makeStructure({
      structureVersions: [
        {
          effectiveDate: new Date("2020-03-01T00:00:00.000Z"),
          structureVersionTransformation: finalizedTransformation(
            { id: 1, type: StructureVersionTransformationType.CREATION },
            [
              {
                id: 2,
                type: StructureVersionTransformationType.FERMETURE,
                structureVersion: makeRef(42),
              },
            ]
          ),
        },
      ],
    });

    const [creation] = buildStructureHistory(structure, []);

    expect(creation).toEqual({
      kind: "CREATION",
      date: "2020-03-01T00:00:00.000Z",
      sources: [{ id: 42, codeBhasile: "BHA-NOR-42" }],
    });
  });
});

describe("buildStructureHistory — transformations", () => {
  it("liste les sources d'une extension (sœurs en contraction/fermeture, direction opposée)", () => {
    const structure = makeStructure({
      creationDate: new Date("2014-01-01T00:00:00.000Z"),
      structureVersions: [
        {
          effectiveDate: new Date("2018-12-02T00:00:00.000Z"),
          structureVersionTransformation: finalizedTransformation(
            { id: 10, type: StructureVersionTransformationType.EXTENSION },
            [
              {
                id: 11,
                type: StructureVersionTransformationType.CONTRACTION,
                structureVersion: makeRef(54),
              },
              {
                id: 12,
                type: StructureVersionTransformationType.FERMETURE,
                structureVersion: makeRef(55),
              },
              {
                id: 13,
                type: StructureVersionTransformationType.EXTENSION,
                structureVersion: makeRef(99),
              },
            ]
          ),
        },
      ],
    });

    const extension = buildStructureHistory(structure, []).find(
      (event) => event.kind === "EXTENSION"
    );

    expect(extension).toEqual({
      kind: "EXTENSION",
      date: "2018-12-02T00:00:00.000Z",
      sources: [
        { id: 54, codeBhasile: "BHA-NOR-54" },
        { id: 55, codeBhasile: "BHA-NOR-55" },
      ],
    });
  });

  it("liste les cibles d'une contraction (sœurs en extension/création)", () => {
    const structure = makeStructure({
      creationDate: new Date("2014-01-01T00:00:00.000Z"),
      structureVersions: [
        {
          effectiveDate: new Date("2019-06-01T00:00:00.000Z"),
          structureVersionTransformation: finalizedTransformation(
            { id: 20, type: StructureVersionTransformationType.CONTRACTION },
            [
              {
                id: 21,
                type: StructureVersionTransformationType.EXTENSION,
                structureVersion: makeRef(70),
              },
            ]
          ),
        },
      ],
    });

    const contraction = buildStructureHistory(structure, []).find(
      (event) => event.kind === "CONTRACTION"
    );

    expect(contraction).toEqual({
      kind: "CONTRACTION",
      date: "2019-06-01T00:00:00.000Z",
      targets: [{ id: 70, codeBhasile: "BHA-NOR-70" }],
    });
  });

  it("expose le motif et les cibles d'une fermeture", () => {
    const structure = makeStructure({
      creationDate: new Date("2014-01-01T00:00:00.000Z"),
      structureVersions: [
        {
          effectiveDate: new Date("2021-09-01T00:00:00.000Z"),
          structureVersionTransformation: finalizedTransformation(
            {
              id: 30,
              type: StructureVersionTransformationType.FERMETURE,
              motif: "Fin de convention",
            },
            [
              {
                id: 31,
                type: StructureVersionTransformationType.CREATION,
                structureVersion: makeRef(80),
              },
            ]
          ),
        },
      ],
    });

    const fermeture = buildStructureHistory(structure, []).find(
      (event) => event.kind === "FERMETURE"
    );

    expect(fermeture).toEqual({
      kind: "FERMETURE",
      date: "2021-09-01T00:00:00.000Z",
      targets: [{ id: 80, codeBhasile: "BHA-NOR-80" }],
      motif: "Fin de convention",
    });
  });

  it("ignore les transformations non finalisées (form.status !== true)", () => {
    const structure = makeStructure({
      creationDate: new Date("2014-01-01T00:00:00.000Z"),
      structureVersions: [
        {
          effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
          structureVersionTransformation: {
            id: 40,
            type: StructureVersionTransformationType.EXTENSION,
            motif: null,
            transformation: {
              form: { status: false },
              structureVersionTransformations: [
                {
                  id: 40,
                  type: StructureVersionTransformationType.EXTENSION,
                  structureVersion: null,
                },
              ],
            },
          },
        },
      ],
    });

    const history = buildStructureHistory(structure, []);

    expect(history.map((event) => event.kind)).toEqual(["CREATION"]);
  });
});

describe("buildStructureHistory — CPOM", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("émet une entrée CPOM avec l'opérateur et les départements recomposés", () => {
    const structure = makeStructure({
      creationDate: new Date("2014-01-01T00:00:00.000Z"),
    });
    const cpomStructures = [
      makeCpomStructure({
        dateStart: "2022-02-14T00:00:00.000Z",
        operateurName: "Coallia",
        departements: ["92", "93"],
      }),
    ];

    const entry = buildStructureHistory(structure, cpomStructures).find(
      (event) => event.kind === "CPOM_ENTRY"
    );

    expect(entry).toEqual({
      kind: "CPOM_ENTRY",
      date: "2022-02-14T00:00:00.000Z",
      cpom: { id: 7, operateurName: "Coallia", departements: ["92", "93"] },
    });
  });

  it("retombe sur les dates de convention quand dateStart de la structure est absent", () => {
    const structure = makeStructure({
      creationDate: new Date("2014-01-01T00:00:00.000Z"),
    });
    const cpomStructures = [
      makeCpomStructure({
        dateStart: null,
        conventionStart: "2020-01-01T00:00:00.000Z",
        conventionEnd: "2030-01-01T00:00:00.000Z",
      }),
    ];

    const entry = buildStructureHistory(structure, cpomStructures).find(
      (event) => event.kind === "CPOM_ENTRY"
    );

    expect(entry?.date).toBe("2020-01-01T00:00:00.000Z");
  });

  it("émet une sortie CPOM passée mais pas une sortie future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T00:00:00.000Z"));

    const structure = makeStructure({
      creationDate: new Date("2014-01-01T00:00:00.000Z"),
    });

    const pastExit = buildStructureHistory(structure, [
      makeCpomStructure({
        dateStart: "2018-01-01T00:00:00.000Z",
        dateEnd: "2022-12-31T00:00:00.000Z",
      }),
    ]);
    expect(pastExit.some((event) => event.kind === "CPOM_EXIT")).toBe(true);

    const futureExit = buildStructureHistory(structure, [
      makeCpomStructure({
        dateStart: "2018-01-01T00:00:00.000Z",
        dateEnd: "2030-12-31T00:00:00.000Z",
      }),
    ]);
    expect(futureExit.some((event) => event.kind === "CPOM_EXIT")).toBe(false);
  });

  it("n'émet pas une entrée CPOM future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T00:00:00.000Z"));

    const structure = makeStructure({
      creationDate: new Date("2014-01-01T00:00:00.000Z"),
    });
    const history = buildStructureHistory(structure, [
      makeCpomStructure({ dateStart: "2027-01-01T00:00:00.000Z" }),
    ]);

    expect(history.some((event) => event.kind === "CPOM_ENTRY")).toBe(false);
  });
});

describe("buildStructureHistory — tri", () => {
  it("trie du plus récent au plus ancien, création en dernier", () => {
    const structure = makeStructure({
      creationDate: new Date("2014-10-09T00:00:00.000Z"),
      structureVersions: [
        {
          effectiveDate: new Date("2018-12-02T00:00:00.000Z"),
          structureVersionTransformation: finalizedTransformation({
            id: 50,
            type: StructureVersionTransformationType.EXTENSION,
          }),
        },
      ],
    });
    const cpomStructures = [
      makeCpomStructure({ dateStart: "2022-02-14T00:00:00.000Z" }),
    ];

    const history = buildStructureHistory(structure, cpomStructures);

    expect(history.map((event) => event.kind)).toEqual([
      "CPOM_ENTRY",
      "EXTENSION",
      "CREATION",
    ]);
  });
});
