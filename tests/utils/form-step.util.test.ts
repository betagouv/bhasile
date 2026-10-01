import { describe, expect, it } from "vitest";

import { areAllFormStepsValidated } from "@/app/utils/formStep.util";
import { StepStatus } from "@/types/form.type";

describe("areAllFormStepsValidated", () => {
  it("renvoie false quand les étapes sont absentes (formulaire introuvable)", () => {
    expect(areAllFormStepsValidated(undefined)).toBe(false);
  });

  it("renvoie true quand le formulaire n'a aucune étape (rien à valider)", () => {
    expect(areAllFormStepsValidated([])).toBe(true);
  });

  it("renvoie false quand une étape n'est pas validée", () => {
    expect(
      areAllFormStepsValidated([
        { status: StepStatus.VALIDE },
        { status: StepStatus.A_VERIFIER },
      ])
    ).toBe(false);
  });

  it("renvoie true quand toutes les étapes sont validées", () => {
    expect(
      areAllFormStepsValidated([
        { status: StepStatus.VALIDE },
        { status: StepStatus.VALIDE },
      ])
    ).toBe(true);
  });
});
