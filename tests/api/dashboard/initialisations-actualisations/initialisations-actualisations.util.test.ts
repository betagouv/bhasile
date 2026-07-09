import { describe, expect, it } from "vitest";

import { actualisationCampaignDefinitionSlug } from "@/app/api/campaigns/campaign.constants";
import {
  getActualisationStatus,
  getInitialisationStatus,
  getMostUrgentActionUrl,
  isOpen,
} from "@/app/api/dashboard/initialisations-actualisations/initialisations-actualisations.util";
import { StructureCampaignApiRead } from "@/schemas/api/structure.schema";
import { StepStatus } from "@/types/form.type";

const YEAR = 2026;

const actualisationCampaign = (
  steps: StructureCampaignApiRead["formSteps"],
  isValidated = false
): StructureCampaignApiRead => ({
  slug: actualisationCampaignDefinitionSlug(YEAR),
  isValidated,
  formSteps: steps,
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

  it("renvoie A_DEBUTER quand aucune campagne de l'année n'existe", () => {
    expect(getActualisationStatus([], YEAR)).toBe("A_DEBUTER");
  });

  it("renvoie A_DEBUTER quand tous les steps sont NON_COMMENCE", () => {
    const campaigns = [
      actualisationCampaign([
        { slug: "01-places", status: StepStatus.NON_COMMENCE },
      ]),
    ];
    expect(getActualisationStatus(campaigns, YEAR)).toBe("A_DEBUTER");
  });

  it("renvoie EN_COURS quand au moins un step est démarré", () => {
    const campaigns = [
      actualisationCampaign([
        { slug: "01-places", status: StepStatus.COMMENCE },
        { slug: "02-documents-financiers", status: StepStatus.NON_COMMENCE },
      ]),
    ];
    expect(getActualisationStatus(campaigns, YEAR)).toBe("EN_COURS");
  });

  it("renvoie FINALISEE quand la campagne est validée", () => {
    const campaigns = [
      actualisationCampaign(
        [{ slug: "01-places", status: StepStatus.VALIDE }],
        true
      ),
    ];
    expect(getActualisationStatus(campaigns, YEAR)).toBe("FINALISEE");
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
