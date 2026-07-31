import { describe, expect, it } from "vitest";

import {
  buildDashboardTransformationRows,
  buildTransformationSummary,
  getTransformationStatus,
} from "@/app/api/dashboard/transformations/transformations.util";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import { StructureType } from "@/types/structure.type";
import { StructureVersionTransformationType } from "@/types/transformation.type";

type SvtInput = {
  id?: number;
  type: StructureVersionTransformationType;
  structureType?: StructureType | null;
  operateur?: { id: number; name: string };
  structureOperateur?: { id: number; name: string };
  departement?: string;
  formStepStatuses?: StepStatus[];
};

const makeSvt = (input: SvtInput): StructureVersionTransformationApiRead =>
  ({
    id: input.id ?? 1,
    type: input.type,
    structureType: input.structureType ?? null,
    operateur: input.operateur,
    structureVersion:
      input.departement || input.structureOperateur
        ? {
            departementAdministratif: input.departement,
            structure: input.structureOperateur
              ? { operateur: input.structureOperateur }
              : undefined,
          }
        : undefined,
    form: input.formStepStatuses
      ? { formSteps: input.formStepStatuses.map((status) => ({ status })) }
      : undefined,
  }) as unknown as StructureVersionTransformationApiRead;

const makeTransformation = (input: {
  id?: number;
  updatedAt?: string;
  svts: StructureVersionTransformationApiRead[];
}): TransformationApiRead =>
  ({
    id: input.id ?? 1,
    updatedAt: input.updatedAt ?? "2026-05-04T00:00:00.000Z",
    structureVersionTransformations: input.svts,
  }) as unknown as TransformationApiRead;

const noFilters = {
  departementList: [],
  operateurList: [],
  typeList: [],
};

describe("getTransformationStatus", () => {
  it("renvoie A_INITIALISER quand tous les formSteps des SVT sont NON_COMMENCE", () => {
    const transformation = makeTransformation({
      svts: [
        makeSvt({
          type: StructureVersionTransformationType.FERMETURE,
          formStepStatuses: [StepStatus.NON_COMMENCE, StepStatus.NON_COMMENCE],
        }),
      ],
    });

    expect(getTransformationStatus(transformation)).toBe("A_INITIALISER");
  });

  it("renvoie A_INITIALISER quand aucun SVT n'a de formulaire", () => {
    const transformation = makeTransformation({
      svts: [makeSvt({ type: StructureVersionTransformationType.CREATION })],
    });

    expect(getTransformationStatus(transformation)).toBe("A_INITIALISER");
  });

  it("renvoie A_FINALISER quand au moins un formStep est commencé", () => {
    const transformation = makeTransformation({
      svts: [
        makeSvt({
          type: StructureVersionTransformationType.FERMETURE,
          formStepStatuses: [StepStatus.NON_COMMENCE],
        }),
        makeSvt({
          type: StructureVersionTransformationType.EXTENSION,
          formStepStatuses: [StepStatus.COMMENCE],
        }),
      ],
    });

    expect(getTransformationStatus(transformation)).toBe("A_FINALISER");
  });
});

describe("buildTransformationSummary", () => {
  it("décrit un SVT unique avec son type de structure", () => {
    const summary = buildTransformationSummary([
      makeSvt({
        type: StructureVersionTransformationType.FERMETURE,
        structureType: StructureType.CADA,
      }),
    ]);

    expect(summary).toBe("1 fermeture (CADA)");
  });

  it("regroupe les SVT de même type et même type de structure et pluralise", () => {
    const summary = buildTransformationSummary([
      makeSvt({
        type: StructureVersionTransformationType.FERMETURE,
        structureType: StructureType.HUDA,
      }),
      makeSvt({
        type: StructureVersionTransformationType.FERMETURE,
        structureType: StructureType.HUDA,
      }),
      makeSvt({
        type: StructureVersionTransformationType.CREATION,
        structureType: StructureType.CADA,
      }),
    ]);

    expect(summary).toBe("2 fermetures (HUDA) et 1 création (CADA)");
  });

  it("ordonne les groupes par type (fermeture avant extension)", () => {
    const summary = buildTransformationSummary([
      makeSvt({
        type: StructureVersionTransformationType.EXTENSION,
        structureType: StructureType.CADA,
      }),
      makeSvt({
        type: StructureVersionTransformationType.FERMETURE,
        structureType: StructureType.CADA,
      }),
    ]);

    expect(summary).toBe("1 fermeture (CADA) et 1 extension (CADA)");
  });

  it("omet les parenthèses quand le type de structure est absent", () => {
    const summary = buildTransformationSummary([
      makeSvt({
        type: StructureVersionTransformationType.FERMETURE,
        structureType: null,
      }),
    ]);

    expect(summary).toBe("1 fermeture");
  });
});

describe("buildDashboardTransformationRows", () => {
  const openTransformation = (
    overrides: Partial<{
      id: number;
      operateur: { id: number; name: string };
      departement: string;
      structureType: StructureType;
      started: boolean;
    }> = {}
  ): TransformationApiRead =>
    makeTransformation({
      id: overrides.id ?? 1,
      svts: [
        makeSvt({
          type: StructureVersionTransformationType.FERMETURE,
          structureType: overrides.structureType ?? StructureType.CADA,
          operateur: overrides.operateur ?? { id: 1, name: "Adoma" },
          departement: overrides.departement ?? "50",
          formStepStatuses: overrides.started
            ? [StepStatus.COMMENCE]
            : [StepStatus.NON_COMMENCE],
        }),
      ],
    });

  it("exclut une transformation sans département résolvable (création ex-nihilo)", () => {
    const transformation = makeTransformation({
      svts: [
        makeSvt({
          type: StructureVersionTransformationType.CREATION,
          departement: undefined,
        }),
      ],
    });

    expect(
      buildDashboardTransformationRows([transformation], noFilters)
    ).toHaveLength(0);
  });

  it("applique le filtre départements", () => {
    const transformation = openTransformation({ departement: "50" });

    expect(
      buildDashboardTransformationRows([transformation], {
        ...noFilters,
        departementList: ["76"],
      })
    ).toHaveLength(0);
    expect(
      buildDashboardTransformationRows([transformation], {
        ...noFilters,
        departementList: ["50"],
      })
    ).toHaveLength(1);
  });

  it("filtre les opérateurs par ID et pas par nom", () => {
    const transformation = openTransformation({
      operateur: { id: 1, name: "Adoma" },
    });

    expect(
      buildDashboardTransformationRows([transformation], {
        ...noFilters,
        operateurList: ["2"],
      })
    ).toHaveLength(0);
    expect(
      buildDashboardTransformationRows([transformation], {
        ...noFilters,
        operateurList: ["1"],
      })
    ).toHaveLength(1);
    expect(
      buildDashboardTransformationRows([transformation], {
        ...noFilters,
        operateurList: ["Adoma"],
      })
    ).toHaveLength(0);
  });

  it("résout l'opérateur via la structure source quand le SVT n'en porte pas", () => {
    const transformation = makeTransformation({
      svts: [
        makeSvt({
          type: StructureVersionTransformationType.FERMETURE,
          departement: "50",
          structureOperateur: { id: 1, name: "Adoma" },
        }),
      ],
    });

    const withoutFilter = buildDashboardTransformationRows(
      [transformation],
      noFilters
    );
    expect(withoutFilter[0].operateurName).toBe("Adoma");

    expect(
      buildDashboardTransformationRows([transformation], {
        ...noFilters,
        operateurList: ["1"],
      })
    ).toHaveLength(1);
  });

  it("filtre par type de structure si n'importe quel SVT correspond", () => {
    const transformation = makeTransformation({
      svts: [
        makeSvt({
          type: StructureVersionTransformationType.FERMETURE,
          structureType: StructureType.HUDA,
          departement: "50",
          operateur: { id: 1, name: "Adoma" },
        }),
        makeSvt({
          type: StructureVersionTransformationType.CREATION,
          structureType: StructureType.CADA,
        }),
      ],
    });

    expect(
      buildDashboardTransformationRows([transformation], {
        ...noFilters,
        typeList: ["CPH"],
      })
    ).toHaveLength(0);
    expect(
      buildDashboardTransformationRows([transformation], {
        ...noFilters,
        typeList: ["CADA"],
      })
    ).toHaveLength(1);
  });

  it("mappe la ligne et masque la date pour une transformation à initialiser", () => {
    const transformation = openTransformation({
      id: 7,
      operateur: { id: 3, name: "Coallia" },
      departement: "76",
      started: false,
    });

    const [row] = buildDashboardTransformationRows([transformation], noFilters);

    expect(row).toMatchObject({
      transformationId: 7,
      operateurName: "Coallia",
      departementAdministratif: "76",
      status: "A_INITIALISER",
      updatedAt: null,
      actionUrl: "/structures/transformation/7",
    });
  });

  it("conserve la date de modification pour une transformation à finaliser", () => {
    const transformation = makeTransformation({
      id: 9,
      updatedAt: "2026-05-04T00:00:00.000Z",
      svts: [
        makeSvt({
          type: StructureVersionTransformationType.FERMETURE,
          structureType: StructureType.CADA,
          departement: "50",
          operateur: { id: 1, name: "Adoma" },
          formStepStatuses: [StepStatus.COMMENCE],
        }),
      ],
    });

    const [row] = buildDashboardTransformationRows([transformation], noFilters);

    expect(row.status).toBe("A_FINALISER");
    expect(row.updatedAt).toBe("2026-05-04T00:00:00.000Z");
  });

  it("trie les à finaliser avant les à initialiser, puis par opérateur, puis par id", () => {
    const rows = buildDashboardTransformationRows(
      [
        openTransformation({
          id: 1,
          operateur: { id: 1, name: "Coallia" },
          started: false,
        }),
        openTransformation({
          id: 2,
          operateur: { id: 2, name: "Adoma" },
          started: true,
        }),
        openTransformation({
          id: 3,
          operateur: { id: 3, name: "Coallia" },
          started: true,
        }),
        openTransformation({
          id: 4,
          operateur: { id: 4, name: "Adoma" },
          started: false,
        }),
      ],
      noFilters
    );

    expect(
      rows.map((row) => [row.status, row.operateurName, row.transformationId])
    ).toEqual([
      ["A_FINALISER", "Adoma", 2],
      ["A_FINALISER", "Coallia", 3],
      ["A_INITIALISER", "Adoma", 4],
      ["A_INITIALISER", "Coallia", 1],
    ]);
  });
});
