import { describe, expect, it } from "vitest";

import { AnomalieStructure } from "@/app/api/dashboard/anomalies/anomalies.db.type";
import {
  buildDashboardAnomalies,
  groupDashboardAnomalies,
} from "@/app/api/dashboard/anomalies/anomalies.util";
import { FINALISATION_FORM_SLUG } from "@/app/api/forms/form.constants";
import { StructureVersionTransformationType } from "@/generated/prisma/enums";
import { SessionUser } from "@/types/global";
import { StructureType } from "@/types/structure.type";

const NOW = new Date("2026-07-10T00:00:00.000Z");

const agent: SessionUser = {
  id: "1",
  name: "Agent",
  prenom: "Agent",
  email: "agent@gouv.fr",
  role: "DEPARTEMENT",
  allowedDepartements: ["50", "92"],
};

const baseOptions = {
  user: agent,
  departementList: [],
  operateurList: [],
  typeList: [],
  shouldShowIgnored: false,
  now: NOW,
};

type AnomalieFixture = AnomalieStructure["anomalies"][number];

const makeAnomalie = (
  overrides: Partial<AnomalieFixture> = {}
): AnomalieFixture => ({
  id: overrides.id ?? 1,
  code: overrides.code ?? "RESULTAT_NET_EQ_0",
  year: overrides.year ?? 2025,
  isJustified: overrides.isJustified ?? null,
  commentaire: overrides.commentaire ?? null,
});

const makeStructure = (
  overrides: Partial<Omit<AnomalieStructure, "structureVersions">> & {
    versionTransformationType?: StructureVersionTransformationType | null;
    versionDepartement?: string | null;
  } = {}
): AnomalieStructure => {
  const versionTransformationType = overrides.versionTransformationType ?? null;

  return {
    id: overrides.id ?? 1,
    codeBhasile: overrides.codeBhasile ?? "BHA-NOR-024",
    type: overrides.type ?? StructureType.CADA,
    departementAdministratif: overrides.departementAdministratif ?? "50",
    fermetureDate: overrides.fermetureDate ?? null,
    operateur: overrides.operateur ?? { id: 1, name: "Adoma" },
    forms: overrides.forms ?? [
      { status: true, formDefinition: { slug: FINALISATION_FORM_SLUG } },
    ],
    structureVersions: [
      {
        id: 1,
        effectiveDate: new Date("2020-01-01"),
        communeAdministrative: "Avranches",
        departementAdministratif:
          overrides.versionDepartement === undefined
            ? "50"
            : overrides.versionDepartement,
        structureVersionTransformationId:
          versionTransformationType === null ? null : 7,
        structureVersionTransformation:
          versionTransformationType === null
            ? null
            : {
                type: versionTransformationType,
                transformation: { form: { status: true } },
              },
      },
    ],
    anomalies: overrides.anomalies ?? [makeAnomalie()],
  };
};

describe("buildDashboardAnomalies", () => {
  it("remonte les anomalies d'une structure finalisée par son formulaire", () => {
    const anomalies = buildDashboardAnomalies([makeStructure()], baseOptions);

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]).toMatchObject({
      structureCodeBhasile: "BHA-NOR-024",
      structureCommune: "Avranches",
      structureDepartement: "50",
      operateurName: "Adoma",
      year: 2025,
    });
  });

  it("remonte les anomalies d'une structure née d'une création, sans formulaire de finalisation", () => {
    const structure = makeStructure({
      forms: [],
      versionTransformationType: StructureVersionTransformationType.CREATION,
    });

    expect(buildDashboardAnomalies([structure], baseOptions)).toHaveLength(1);
  });

  it("écarte une structure qui n'est pas finalisée", () => {
    const structure = makeStructure({
      forms: [{ status: false, formDefinition: { slug: FINALISATION_FORM_SLUG } }],
    });

    expect(buildDashboardAnomalies([structure], baseOptions)).toEqual([]);
  });

  it("écarte une structure dont la fermeture a pris effet", () => {
    const structure = makeStructure({ fermetureDate: new Date("2026-03-01") });

    expect(buildDashboardAnomalies([structure], baseOptions)).toEqual([]);
  });

  it("garde une structure dont la fermeture n'est pas encore effective", () => {
    const structure = makeStructure({ fermetureDate: new Date("2026-12-31") });

    expect(buildDashboardAnomalies([structure], baseOptions)).toHaveLength(1);
  });

  it("écarte une structure hors du périmètre de l'agent", () => {
    const structure = makeStructure({ departementAdministratif: "75" });

    expect(buildDashboardAnomalies([structure], baseOptions)).toEqual([]);
  });

  it("filtre sur le département de la structure mais affiche celui de la version", () => {
    const structure = makeStructure({
      departementAdministratif: "50",
      versionDepartement: null,
    });

    const anomalies = buildDashboardAnomalies([structure], {
      ...baseOptions,
      departementList: ["50"],
    });

    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].structureDepartement).toBeNull();
  });

  it("applique les filtres département, opérateur et type de l'entête", () => {
    const structures = [
      makeStructure({ id: 1, departementAdministratif: "50" }),
      makeStructure({ id: 2, departementAdministratif: "92" }),
    ];

    expect(
      buildDashboardAnomalies(structures, {
        ...baseOptions,
        departementList: ["92"],
      })
    ).toHaveLength(1);
    expect(
      buildDashboardAnomalies(structures, {
        ...baseOptions,
        operateurList: ["2"],
      })
    ).toEqual([]);
    expect(
      buildDashboardAnomalies(structures, {
        ...baseOptions,
        typeList: [StructureType.HUDA],
      })
    ).toEqual([]);
  });

  it("masque les anomalies ignorées par défaut", () => {
    const structure = makeStructure({
      anomalies: [
        makeAnomalie({ id: 1, isJustified: true }),
        makeAnomalie({ id: 2, isJustified: null }),
      ],
    });

    const anomalies = buildDashboardAnomalies([structure], baseOptions);

    expect(anomalies.map(({ id }) => id)).toEqual([2]);
  });

  it("garde une anomalie rouverte visible quand l'interrupteur est éteint", () => {
    const structure = makeStructure({
      anomalies: [makeAnomalie({ id: 1, isJustified: false })],
    });

    expect(buildDashboardAnomalies([structure], baseOptions)).toHaveLength(1);
  });

  it("expose les anomalies ignorées quand l'interrupteur est actif", () => {
    const structure = makeStructure({
      anomalies: [
        makeAnomalie({ id: 1, isJustified: true, commentaire: "Vérifié" }),
        makeAnomalie({ id: 2, isJustified: null }),
      ],
    });

    const anomalies = buildDashboardAnomalies([structure], {
      ...baseOptions,
      shouldShowIgnored: true,
    });

    expect(anomalies).toHaveLength(2);
    expect(anomalies.find(({ id }) => id === 1)?.commentaire).toBe("Vérifié");
  });

  it("construit l'URL d'examen depuis la section de modification du code", () => {
    const structure = makeStructure({
      id: 42,
      anomalies: [
        makeAnomalie({ id: 1, code: "RESULTAT_NET_EQ_0" }),
        makeAnomalie({ id: 2, code: "PLACES_ADRESSES_ECART_STRUCTURE" }),
      ],
    });

    const anomalies = buildDashboardAnomalies([structure], baseOptions);

    expect(anomalies.map(({ actionUrl }) => actionUrl)).toEqual([
      "/structures/42/modification/finances",
      "/structures/42/modification/adresses",
    ]);
  });
});

describe("groupDashboardAnomalies", () => {
  it("groupe par structure et compte les anomalies actives", () => {
    const anomalies = buildDashboardAnomalies(
      [
        makeStructure({
          id: 1,
          anomalies: [makeAnomalie({ id: 1 }), makeAnomalie({ id: 2 })],
        }),
        makeStructure({ id: 2, anomalies: [makeAnomalie({ id: 3 })] }),
      ],
      baseOptions
    );

    const nodes = groupDashboardAnomalies(anomalies, "STRUCTURE");

    expect(nodes.map(({ key, activeCount }) => ({ key, activeCount }))).toEqual([
      { key: "structure-1", activeCount: 2 },
      { key: "structure-2", activeCount: 1 },
    ]);
  });

  it("groupe par code sans éclater les exercices", () => {
    const anomalies = buildDashboardAnomalies(
      [
        makeStructure({
          id: 1,
          anomalies: [
            makeAnomalie({ id: 1, year: 2024 }),
            makeAnomalie({ id: 2, year: 2025 }),
          ],
        }),
      ],
      baseOptions
    );

    const nodes = groupDashboardAnomalies(anomalies, "CODE");

    expect(nodes).toHaveLength(1);
    expect(nodes[0].key).toBe("code-RESULTAT_NET_EQ_0");
    expect(nodes[0].anomalies.map(({ year }) => year)).toEqual([2025, 2024]);
  });

  it("ne compte pas les ignorées mais compte les rouvertes", () => {
    const anomalies = buildDashboardAnomalies(
      [
        makeStructure({
          anomalies: [
            makeAnomalie({ id: 1, isJustified: true }),
            makeAnomalie({ id: 2, isJustified: false }),
            makeAnomalie({ id: 3, isJustified: null }),
          ],
        }),
      ],
      { ...baseOptions, shouldShowIgnored: true }
    );

    const [node] = groupDashboardAnomalies(anomalies, "STRUCTURE");

    expect(node.anomalies).toHaveLength(3);
    expect(node.activeCount).toBe(2);
  });

  it("repousse les anomalies ignorées en bas du groupe", () => {
    const anomalies = buildDashboardAnomalies(
      [
        makeStructure({
          anomalies: [
            makeAnomalie({ id: 1, isJustified: true }),
            makeAnomalie({ id: 2, isJustified: null }),
          ],
        }),
      ],
      { ...baseOptions, shouldShowIgnored: true }
    );

    const [node] = groupDashboardAnomalies(anomalies, "STRUCTURE");

    expect(node.anomalies.map(({ id }) => id)).toEqual([2, 1]);
  });

  it("trie les groupes par code Bhasile, sans tenir compte du nombre d'anomalies", () => {
    const anomalies = buildDashboardAnomalies(
      [
        makeStructure({
          id: 1,
          codeBhasile: "BHA-NOR-100",
          anomalies: [
            makeAnomalie({ id: 1 }),
            makeAnomalie({ id: 2, code: "TAUX_ENCADREMENT_LT_2" }),
          ],
        }),
        makeStructure({
          id: 2,
          codeBhasile: "BHA-NOR-024",
          anomalies: [makeAnomalie({ id: 3 })],
        }),
      ],
      baseOptions
    );

    expect(
      groupDashboardAnomalies(anomalies, "STRUCTURE").map(({ key }) => key)
    ).toEqual(["structure-2", "structure-1"]);
  });

  it("trie les groupes par ordre du registre en groupement par anomalie", () => {
    const anomalies = buildDashboardAnomalies(
      [
        makeStructure({
          anomalies: [
            makeAnomalie({ id: 1, code: "RESULTAT_NET_EQ_0" }),
            makeAnomalie({ id: 2, code: "AUTORISATION_DUREE_NOT_15Y" }),
          ],
        }),
      ],
      baseOptions
    );

    expect(
      groupDashboardAnomalies(anomalies, "CODE").map(({ key }) => key)
    ).toEqual(["code-AUTORISATION_DUREE_NOT_15Y", "code-RESULTAT_NET_EQ_0"]);
  });
});
