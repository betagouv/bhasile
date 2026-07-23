import { describe, expect, it } from "vitest";

import { CpomDbList } from "@/app/api/cpoms/cpom.db.type";
import { RappelStructure } from "@/app/api/dashboard/rappels/rappels.db.type";
import { buildRappels } from "@/app/api/dashboard/rappels/rappels.util";
import { SessionUser } from "@/types/global";
import { StructureType } from "@/types/structure.type";

const NOW = new Date("2026-07-10T00:00:00.000Z");

const agent: SessionUser = {
  id: "1",
  name: "Agent",
  prenom: "Agent",
  email: "agent@gouv.fr",
  role: "DEPARTEMENT",
  allowedDepartements: ["50", "92", "93"],
};

const baseOptions = {
  user: agent,
  departementList: [],
  operateurList: [],
  typeList: [],
  now: NOW,
};

const parentActe = (
  category: string,
  start: string | null,
  end: string | null,
  id = 1
) => ({
  id,
  category,
  parentId: null,
  startDate: start ? new Date(start) : null,
  endDate: end ? new Date(end) : null,
});

const makeStructure = (
  overrides: Partial<{
    id: number;
    type: StructureType | null;
    departementAdministratif: string | null;
    operateur: { id: number; name: string } | null;
    actesAdministratifs: ReturnType<typeof parentActe>[];
    evaluations: { date: Date | null }[];
    cpomStructures: unknown[];
    forms: { status: boolean }[];
  }> = {}
): RappelStructure =>
  ({
    id: overrides.id ?? 1,
    codeBhasile: "BHA-001",
    type: overrides.type ?? StructureType.CADA,
    structureVersions: [
      {
        effectiveDate: new Date("2020-01-01"),
        communeAdministrative: "Avranches",
        structureVersionTransformationId: null,
      },
    ],
    departementAdministratif: overrides.departementAdministratif ?? "50",
    operateur: overrides.operateur ?? { id: 1, name: "Adoma" },
    forms: overrides.forms ?? [{ status: true }],
    actesAdministratifs: overrides.actesAdministratifs ?? [],
    evaluations: overrides.evaluations ?? [],
    cpomStructures: overrides.cpomStructures ?? [],
  }) as unknown as RappelStructure;

const makeCpom = (
  overrides: Partial<{
    id: number;
    actesAdministratifs: ReturnType<typeof parentActe>[];
    departementNumeros: string[];
    operateur: { id: number; name: string };
  }> = {}
): CpomDbList =>
  ({
    id: overrides.id ?? 10,
    name: "COALLIA",
    operateur: overrides.operateur ?? { id: 2, name: "Coallia" },
    departements: (overrides.departementNumeros ?? ["92", "93"]).map(
      (numero) => ({ departement: { numero } })
    ),
    actesAdministratifs: overrides.actesAdministratifs ?? [],
  }) as unknown as CpomDbList;

const findByTask = (structure: RappelStructure, taskType: string) =>
  buildRappels([structure], [], baseOptions).find(
    (rappel) => rappel.taskType === taskType
  );

describe("buildRappels — criticité v2 (renouvellement autorisation, fenêtre 3 mois)", () => {
  it("marque en urgent quand l'échéance est dépassée", () => {
    const structure = makeStructure({
      actesAdministratifs: [parentActe("ARRETE_AUTORISATION", "2010-01-01", "2026-06-01")],
    });
    expect(findByTask(structure, "RENOUVELLEMENT_AUTORISATION")?.criticite).toBe(
      "URGENT"
    );
  });

  it("marque en important quand l'échéance est dans la fenêtre de 3 mois", () => {
    const structure = makeStructure({
      actesAdministratifs: [parentActe("ARRETE_AUTORISATION", "2010-01-01", "2026-08-01")],
    });
    expect(findByTask(structure, "RENOUVELLEMENT_AUTORISATION")?.criticite).toBe(
      "IMPORTANT"
    );
  });

  it("ne crée pas de rappel quand l'échéance est au-delà de la fenêtre", () => {
    const structure = makeStructure({
      actesAdministratifs: [parentActe("ARRETE_AUTORISATION", "2010-01-01", "2028-01-01")],
    });
    expect(findByTask(structure, "RENOUVELLEMENT_AUTORISATION")).toBeUndefined();
  });
});

describe("buildRappels — évaluation (période d'autorisation ÷ 3)", () => {
  const withAutorisation = (
    start: string,
    end: string,
    evaluations: { date: Date | null }[] = []
  ) =>
    makeStructure({
      type: StructureType.CADA,
      actesAdministratifs: [parentActe("ARRETE_AUTORISATION", start, end)],
      evaluations,
    });

  it("marque en orange 'à mener' quand ni la période précédente ni la courante n'ont d'évaluation", () => {
    // debut 2020 → now (2026-07) dans P1 [2025,2030] ; précédente P0 [2020,2025] ; aucune éval
    const structure = withAutorisation("2020-01-01", "2035-01-01");
    const rappel = findByTask(structure, "EVALUATION");
    expect(rappel?.criticite).toBe("URGENT");
    expect(rappel?.taskLabel).toBe("Évaluation à mener");
  });

  it("marque en jaune 'à lancer' quand la période courante finit dans moins de 18 mois sans évaluation", () => {
    // debut 2022-07 → now dans P0 [2022-07, 2027-07] (fin < 18 mois), pas de précédente
    const structure = withAutorisation("2022-07-01", "2037-07-01");
    const rappel = findByTask(structure, "EVALUATION");
    expect(rappel?.criticite).toBe("IMPORTANT");
    expect(rappel?.taskLabel).toBe("Évaluation à lancer");
  });

  it("marque en jaune quand la précédente a été évaluée mais pas la courante (fin < 18 mois)", () => {
    // debut 2017-07 → now dans P1 [2022-07,2027-07] ; éval 2020 dans P0 → précédente OK
    const structure = withAutorisation("2017-07-01", "2032-07-01", [
      { date: new Date("2020-01-01") },
    ]);
    expect(findByTask(structure, "EVALUATION")?.criticite).toBe("IMPORTANT");
  });

  it("ne crée pas de rappel quand une évaluation a eu lieu dans la période courante", () => {
    // debut 2020 → P1 [2025,2030] ; éval 2025-06 dedans
    const structure = withAutorisation("2020-01-01", "2035-01-01", [
      { date: new Date("2025-06-01") },
    ]);
    expect(findByTask(structure, "EVALUATION")).toBeUndefined();
  });

  it("ne crée pas de rappel quand la période courante est loin de sa fin (trop tôt)", () => {
    // debut 2025 → now dans P0 [2025,2030], fin dans ~3,5 ans (> 18 mois)
    const structure = withAutorisation("2025-01-01", "2040-01-01");
    expect(findByTask(structure, "EVALUATION")).toBeUndefined();
  });

  it("ne crée pas de rappel éval sans date d'autorisation", () => {
    const structure = makeStructure({
      type: StructureType.CADA,
      actesAdministratifs: [],
      evaluations: [],
    });
    expect(findByTask(structure, "EVALUATION")).toBeUndefined();
  });

  it("ne crée aucun rappel éval pour une structure non autorisée (HUDA)", () => {
    const structure = makeStructure({
      type: StructureType.HUDA,
      actesAdministratifs: [
        parentActe("ARRETE_AUTORISATION", "2020-01-01", "2035-01-01"),
      ],
      evaluations: [],
    });
    expect(findByTask(structure, "EVALUATION")).toBeUndefined();
  });
});

describe("buildRappels — scoping & CPOM", () => {
  it("exclut une structure hors des départements de l'agent", () => {
    const structure = makeStructure({
      departementAdministratif: "69",
      actesAdministratifs: [parentActe("ARRETE_AUTORISATION", "2010-01-01", "2026-06-01")],
    });
    expect(buildRappels([structure], [], baseOptions)).toHaveLength(0);
  });

  it("exclut une structure non finalisée", () => {
    const structure = makeStructure({
      forms: [{ status: false }],
      actesAdministratifs: [parentActe("ARRETE_AUTORISATION", "2010-01-01", "2026-06-01")],
    });
    expect(buildRappels([structure], [], baseOptions)).toHaveLength(0);
  });

  it("génère un rappel CPOM quand la convention CPOM finit dans la fenêtre", () => {
    const cpom = makeCpom({
      actesAdministratifs: [parentActe("CONVENTION", "2020-01-01", "2026-08-01")],
    });
    const rappels = buildRappels([], [cpom], baseOptions);
    expect(rappels).toHaveLength(1);
    expect(rappels[0]).toMatchObject({
      echelle: "CPOM",
      taskType: "RENOUVELLEMENT_CPOM",
      criticite: "IMPORTANT",
      actionUrl: "/cpoms/10",
      cpomDepartements: ["92", "93"],
    });
  });

  it("exclut un CPOM dont aucun département n'est couvert par l'agent", () => {
    const cpom = makeCpom({
      departementNumeros: ["75", "78"],
      actesAdministratifs: [parentActe("CONVENTION", "2020-01-01", "2026-08-01")],
    });
    expect(buildRappels([], [cpom], baseOptions)).toHaveLength(0);
  });
});
