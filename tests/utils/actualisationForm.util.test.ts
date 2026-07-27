import { describe, expect, it } from "vitest";

import {
  findActualisationForm,
  getActualisationFormStepStatus,
  getActualisationNextRoute,
  isActualisationReadyToValidate,
} from "@/app/utils/actualisationForm.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { StepStatus } from "@/types/form.type";

import { createStructure } from "../test-utils/structure.factory";

const structureAvecActualisation = (
  year: number,
  formSteps: { slug: string; status: StepStatus }[]
): StructureApiRead => ({
  ...createStructure({ id: 1 }),
  forms: [
    {
      id: 1,
      status: false,
      formDefinition: {
        id: 1,
        slug: `actualisation-${year}`,
        name: "actualisation",
        version: 1,
      },
      formSteps: formSteps.map((step, index) => ({
        id: index,
        status: step.status,
        stepDefinition: { id: index, slug: step.slug, label: step.slug },
      })),
    },
  ],
});

describe("findActualisationForm", () => {
  it("retourne le formulaire d'actualisation de l'année demandée", () => {
    const structure = structureAvecActualisation(2026, []);

    expect(
      findActualisationForm(structure.forms, 2026)?.formDefinition.slug
    ).toBe("actualisation-2026");
  });

  it("retourne undefined si aucun formulaire pour l'année", () => {
    const structure = structureAvecActualisation(2025, []);

    expect(findActualisationForm(structure.forms, 2026)).toBeUndefined();
  });
});

describe("getActualisationFormStepStatus", () => {
  it("retourne le statut de l'étape trouvée", () => {
    const structure = structureAvecActualisation(2026, [
      { slug: "01-places", status: StepStatus.VALIDE },
    ]);

    expect(getActualisationFormStepStatus("01-places", structure, 2026)).toBe(
      StepStatus.VALIDE
    );
  });

  it("retourne NON_COMMENCE si l'étape est absente", () => {
    const structure = structureAvecActualisation(2026, []);

    expect(getActualisationFormStepStatus("01-places", structure, 2026)).toBe(
      StepStatus.NON_COMMENCE
    );
  });
});

describe("isActualisationReadyToValidate", () => {
  it("est prête quand toutes les étapes sont validées", () => {
    const structure = structureAvecActualisation(2026, [
      { slug: "01-places", status: StepStatus.VALIDE },
      { slug: "02-documents-financiers", status: StepStatus.VALIDE },
    ]);

    expect(isActualisationReadyToValidate(structure, 2026)).toBe(true);
  });

  it("n'est pas prête si une étape n'est pas validée", () => {
    const structure = structureAvecActualisation(2026, [
      { slug: "01-places", status: StepStatus.VALIDE },
      { slug: "02-documents-financiers", status: StepStatus.NON_COMMENCE },
    ]);

    expect(isActualisationReadyToValidate(structure, 2026)).toBe(false);
  });

  it("n'est pas prête sans formulaire d'actualisation", () => {
    const structure = createStructure({ id: 1 });

    expect(isActualisationReadyToValidate(structure, 2026)).toBe(false);
  });
});

describe("getActualisationNextRoute", () => {
  it("retourne l'étape suivante", () => {
    expect(getActualisationNextRoute("01-places")).toBe(
      "02-documents-financiers"
    );
  });

  it("retourne undefined pour la dernière étape", () => {
    expect(
      getActualisationNextRoute("04-actes-administratifs")
    ).toBeUndefined();
  });

  it("retourne undefined pour une étape inconnue", () => {
    expect(getActualisationNextRoute("99-inconnue")).toBeUndefined();
  });
});
