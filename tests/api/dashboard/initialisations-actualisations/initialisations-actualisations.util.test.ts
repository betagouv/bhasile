import { describe, expect, it } from "vitest";

import { DashboardStructure } from "@/app/api/dashboard/initialisations-actualisations/initialisations-actualisations.db.type";
import { DashboardStructureRow } from "@/app/api/dashboard/initialisations-actualisations/initialisations-actualisations.type";
import {
  buildDashboardRows,
  getActualisationStatus,
  getInitialisationStatus,
  getMostUrgentActionUrl,
  isOpen,
  paginateDashboardRows,
} from "@/app/api/dashboard/initialisations-actualisations/initialisations-actualisations.util";
import {
  FINALISATION_FORM_SLUG,
  getActualisationFormSlug,
} from "@/app/api/forms/form.constants";
import { StructureVersionTransformationType } from "@/generated/prisma/enums";
import { StepStatus } from "@/types/form.type";
import { SessionUser } from "@/types/global";
import { StructureType } from "@/types/structure.type";

const YEAR = 2026;

const agentDepartement75: SessionUser = {
  id: "1",
  name: "Agent",
  prenom: "Agent",
  email: "agent@dep75.gouv.fr",
  role: "DEPARTEMENT",
  allowedDepartements: ["75"],
};

const actualisationStatusForm = (
  formSteps: { status: StepStatus }[],
  status = false
) => ({
  status,
  formDefinition: { slug: getActualisationFormSlug(YEAR) },
  formSteps,
});

describe("getInitialisationStatus", () => {
  it("renvoie A_INITIALISER quand aucun formulaire de finalisation n'existe", () => {
    expect(getInitialisationStatus([])).toBe("A_INITIALISER");
  });

  it("renvoie A_FINALISER quand le formulaire existe mais n'est pas validé", () => {
    expect(getInitialisationStatus([{ status: false }])).toBe("A_FINALISER");
  });

  it("renvoie FINALISEE quand le formulaire est validé", () => {
    expect(getInitialisationStatus([{ status: true }])).toBe("FINALISEE");
  });
});

describe("getActualisationStatus", () => {
  it("renvoie A_DEBUTER quand l'année est nulle", () => {
    expect(getActualisationStatus([], null)).toBe("A_DEBUTER");
  });

  it("renvoie A_DEBUTER quand aucun formulaire de l'année n'existe", () => {
    expect(getActualisationStatus([], YEAR)).toBe("A_DEBUTER");
  });

  it("renvoie A_DEBUTER quand tous les steps sont NON_COMMENCE", () => {
    const forms = [
      actualisationStatusForm([{ status: StepStatus.NON_COMMENCE }]),
    ];
    expect(getActualisationStatus(forms, YEAR)).toBe("A_DEBUTER");
  });

  it("renvoie EN_COURS quand au moins un step est démarré", () => {
    const forms = [
      actualisationStatusForm([
        { status: StepStatus.COMMENCE },
        { status: StepStatus.NON_COMMENCE },
      ]),
    ];
    expect(getActualisationStatus(forms, YEAR)).toBe("EN_COURS");
  });

  it("renvoie FINALISEE quand le formulaire est validé", () => {
    const forms = [
      actualisationStatusForm([{ status: StepStatus.VALIDE }], true),
    ];
    expect(getActualisationStatus(forms, YEAR)).toBe("FINALISEE");
  });
});

describe("isOpen", () => {
  it("renvoie false quand les deux axes sont finalisés", () => {
    expect(isOpen("FINALISEE", "FINALISEE")).toBe(false);
  });

  it("renvoie true quand l'initialisation reste ouverte", () => {
    expect(isOpen("A_FINALISER", "FINALISEE")).toBe(true);
  });

  it("renvoie true quand l'actualisation reste ouverte", () => {
    expect(isOpen("FINALISEE", "EN_COURS")).toBe(true);
  });
});

describe("getMostUrgentActionUrl", () => {
  it("pointe vers la finalisation quand l'agent doit finaliser", () => {
    expect(getMostUrgentActionUrl(7, "A_FINALISER", "EN_COURS", YEAR)).toBe(
      "/structures/7/finalisation/01-identification"
    );
  });

  it("ne propose pas d'action quand la structure est à initialiser (au tour de l'opérateur)", () => {
    expect(
      getMostUrgentActionUrl(7, "A_INITIALISER", "A_DEBUTER", YEAR)
    ).toBeNull();
  });

  it("pointe vers l'actualisation quand seule l'actualisation est ouverte", () => {
    expect(getMostUrgentActionUrl(7, "FINALISEE", "EN_COURS", YEAR)).toBe(
      "/structures/7/actualisation/2026/01-places"
    );
  });

  it("renvoie null quand les deux axes sont finalisés", () => {
    expect(
      getMostUrgentActionUrl(7, "FINALISEE", "FINALISEE", YEAR)
    ).toBeNull();
  });
});

type DashboardVersion = DashboardStructure["structureVersions"][number];

const makeVersion = (
  overrides: Partial<DashboardVersion> = {}
): DashboardVersion => ({
  id: 1,
  effectiveDate: new Date("2026-01-01"),
  communeAdministrative: "Paris",
  departementAdministratif: "75",
  structureVersionTransformationId: null,
  structureVersionTransformation: null,
  ...overrides,
});

// La finalisation et l'actualisation sont des forms de structure, discriminés par slug.
const finalisationForm = (
  status: boolean
): DashboardStructure["forms"][number] => ({
  status,
  formDefinition: { slug: FINALISATION_FORM_SLUG },
  formSteps: [],
});

const actualisationForm = (
  status: boolean,
  formSteps: DashboardStructure["forms"][number]["formSteps"] = []
): DashboardStructure["forms"][number] => ({
  status,
  formDefinition: { slug: getActualisationFormSlug(YEAR) },
  formSteps,
});

const makeStructure = (
  overrides: Partial<DashboardStructure> = {}
): DashboardStructure => ({
  id: 1,
  codeBhasile: "BHA-001",
  type: StructureType.CADA,
  operateur: { id: 1, name: "Adoma" },
  forms: [],
  structureVersions: [makeVersion()],
  ...overrides,
});

const baseOptions = {
  user: agentDepartement75,
  typeList: [],
  departementList: [],
  operateurList: [],
  year: YEAR,
  now: new Date("2026-06-01"),
};

describe("buildDashboardRows", () => {
  it("inclut une structure à initialiser dans le périmètre et mappe ses champs", () => {
    const rows = buildDashboardRows([makeStructure()], baseOptions);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 1,
      codeBhasile: "BHA-001",
      type: StructureType.CADA,
      operateurName: "Adoma",
      communeAdministrative: "Paris",
      departementAdministratif: "75",
      initialisationStatus: "A_INITIALISER",
      actualisationStatus: "A_DEBUTER",
      actionUrl: null,
    });
  });

  it("exclut une structure hors des départements autorisés (scope)", () => {
    const structure = makeStructure({
      structureVersions: [makeVersion({ departementAdministratif: "69" })],
    });

    expect(buildDashboardRows([structure], baseOptions)).toHaveLength(0);
  });

  it("exclut une structure dont le département courant est null", () => {
    const structure = makeStructure({
      structureVersions: [makeVersion({ departementAdministratif: null })],
    });

    expect(buildDashboardRows([structure], baseOptions)).toHaveLength(0);
  });

  it("applique le filtre départements", () => {
    const structure = makeStructure();

    expect(
      buildDashboardRows([structure], { ...baseOptions, departementList: ["76"] })
    ).toHaveLength(0);
    expect(
      buildDashboardRows([structure], { ...baseOptions, departementList: ["75"] })
    ).toHaveLength(1);
  });

  it("filtre les opérateurs par ID et pas par nom", () => {
    const structure = makeStructure();

    expect(
      buildDashboardRows([structure], { ...baseOptions, operateurList: ["2"] })
    ).toHaveLength(0);
    expect(
      buildDashboardRows([structure], { ...baseOptions, operateurList: ["1"] })
    ).toHaveLength(1);
    expect(
      buildDashboardRows([structure], {
        ...baseOptions,
        operateurList: ["Adoma"],
      })
    ).toHaveLength(0);
  });

  it("applique le filtre type", () => {
    const structure = makeStructure();

    expect(
      buildDashboardRows([structure], { ...baseOptions, typeList: ["HUDA"] })
    ).toHaveLength(0);
    expect(
      buildDashboardRows([structure], { ...baseOptions, typeList: ["CADA"] })
    ).toHaveLength(1);
  });

  it("exclut une structure fermée (dernière version = FERMETURE validée)", () => {
    const structure = makeStructure({
      structureVersions: [
        makeVersion({
          structureVersionTransformationId: 9,
          structureVersionTransformation: {
            type: StructureVersionTransformationType.FERMETURE,
            transformation: { form: { status: true } },
          },
        }),
      ],
    });

    expect(buildDashboardRows([structure], baseOptions)).toHaveLength(0);
  });

  it("exclut une structure finalisée ET actualisée (rien d'ouvert)", () => {
    const structure = makeStructure({
      forms: [finalisationForm(true), actualisationForm(true)],
    });

    expect(buildDashboardRows([structure], baseOptions)).toHaveLength(0);
  });

  it("garde une structure finalisée dont l'actualisation reste à débuter", () => {
    const structure = makeStructure({ forms: [finalisationForm(true)] });

    const rows = buildDashboardRows([structure], baseOptions);

    expect(rows).toHaveLength(1);
    expect(rows[0].initialisationStatus).toBe("FINALISEE");
    expect(rows[0].actualisationStatus).toBe("A_DEBUTER");
    expect(rows[0].actionUrl).toBe("/structures/1/actualisation/2026/01-places");
  });

  it("trie les lignes par codeBhasile croissant", () => {
    const rows = buildDashboardRows(
      [
        makeStructure({ id: 2, codeBhasile: "BHA-003" }),
        makeStructure({ id: 3, codeBhasile: "BHA-001" }),
        makeStructure({ id: 4, codeBhasile: "BHA-002" }),
      ],
      baseOptions
    );

    expect(rows.map((row) => row.codeBhasile)).toEqual([
      "BHA-001",
      "BHA-002",
      "BHA-003",
    ]);
  });
});

const makeRow = (id: number): DashboardStructureRow => ({
  id,
  codeBhasile: `BHA-${id}`,
  type: null,
  operateurName: null,
  communeAdministrative: null,
  departementAdministratif: null,
  initialisationStatus: "A_INITIALISER",
  actualisationStatus: "A_DEBUTER",
  actionUrl: null,
});

describe("paginateDashboardRows", () => {
  const rows = Array.from({ length: 13 }, (_, index) => makeRow(index + 1));

  it("renvoie le total et la première page (12 lignes)", () => {
    const result = paginateDashboardRows(rows, 0);

    expect(result.total).toBe(13);
    expect(result.rows).toHaveLength(12);
  });

  it("renvoie la page suivante", () => {
    const result = paginateDashboardRows(rows, 1);

    expect(result.total).toBe(13);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBe(13);
  });

  it("clampe une page hors borne à la dernière page (jamais vide)", () => {
    const result = paginateDashboardRows(rows, 99);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBe(13);
  });
});
