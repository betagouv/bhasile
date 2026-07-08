import { describe, expect, it } from "vitest";

import {
  getActualisationCampaign,
  getActualisationFormStepStatus,
  getActualisationNextRoute,
  isActualisationReadyToValidate,
} from "@/app/utils/actualisationForm.util";
import { StructureCampaignApiRead } from "@/schemas/api/structure.schema";
import { StepStatus } from "@/types/form.type";

import { createStructure } from "../test-utils/structure.factory";

const structureAvecCampagne = (
  year: number,
  formSteps: StructureCampaignApiRead["formSteps"]
) => ({
  ...createStructure({ id: 1 }),
  campaigns: [{ slug: `actualisation-${year}`, isValidated: false, formSteps }],
});

describe("getActualisationCampaign", () => {
  it("retourne la campagne de l'année demandée", () => {
    const structure = structureAvecCampagne(2026, []);

    expect(getActualisationCampaign(structure, 2026)?.slug).toBe(
      "actualisation-2026"
    );
  });

  it("retourne undefined si aucune campagne pour l'année", () => {
    const structure = structureAvecCampagne(2025, []);

    expect(getActualisationCampaign(structure, 2026)).toBeUndefined();
  });
});

describe("getActualisationFormStepStatus", () => {
  it("retourne le statut de l'étape trouvée", () => {
    const structure = structureAvecCampagne(2026, [
      { slug: "01-places", status: StepStatus.VALIDE },
    ]);

    expect(getActualisationFormStepStatus("01-places", structure, 2026)).toBe(
      StepStatus.VALIDE
    );
  });

  it("retourne NON_COMMENCE si l'étape est absente", () => {
    const structure = structureAvecCampagne(2026, []);

    expect(getActualisationFormStepStatus("01-places", structure, 2026)).toBe(
      StepStatus.NON_COMMENCE
    );
  });
});

describe("isActualisationReadyToValidate", () => {
  it("est prête quand toutes les étapes sont validées", () => {
    const structure = structureAvecCampagne(2026, [
      { slug: "01-places", status: StepStatus.VALIDE },
      { slug: "02-documents-financiers", status: StepStatus.VALIDE },
    ]);

    expect(isActualisationReadyToValidate(structure, 2026)).toBe(true);
  });

  it("n'est pas prête si une étape n'est pas validée", () => {
    const structure = structureAvecCampagne(2026, [
      { slug: "01-places", status: StepStatus.VALIDE },
      { slug: "02-documents-financiers", status: StepStatus.NON_COMMENCE },
    ]);

    expect(isActualisationReadyToValidate(structure, 2026)).toBe(false);
  });

  it("n'est pas prête sans campagne", () => {
    const structure = createStructure({ id: 1 });

    expect(isActualisationReadyToValidate(structure, 2026)).toBe(false);
  });

  it("n'est pas prête si la campagne n'a aucune étape", () => {
    const structure = structureAvecCampagne(2026, []);

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
