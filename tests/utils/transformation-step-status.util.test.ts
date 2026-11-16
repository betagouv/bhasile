import { describe, expect, it } from "vitest";

import { StepStatus } from "@/types/form.type";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";
import {
  getStructureVersionTransformationStepItems,
  isStructureVersionTransformationComplete,
} from "@/utils/transformation-step-status.util";

import {
  createStructureVersionTransformation,
  createTransformation,
  createTransformationForm,
} from "../test-utils/factories/transformation.factory";

const getStatuses = (
  structureVersionTransformation: ReturnType<
    typeof createStructureVersionTransformation
  >
) =>
  Object.fromEntries(
    getStructureVersionTransformationStepItems(
      createTransformation({
        type: TransformationType.OUVERTURE_EX_NIHILO,
        structureVersionTransformations: [structureVersionTransformation],
      }),
      structureVersionTransformation
    ).map((stepItem) => [stepItem.name, stepItem.status])
  );

describe("getStructureVersionTransformationStepItems", () => {
  it("valide les actes administratifs d'une création jamais ouverte, faute de champ obligatoire", () => {
    const statuses = getStatuses(
      createStructureVersionTransformation({
        type: StructureVersionTransformationType.CREATION,
        structureVersion: {},
      })
    );

    expect(statuses).toEqual({
      [StructureVersionTransformationStep.DESCRIPTION]: StepStatus.NON_COMMENCE,
      [StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT]:
        StepStatus.NON_COMMENCE,
      [StructureVersionTransformationStep.ACTES_ADMINISTRATIFS]:
        StepStatus.VALIDE,
    });
  });

  it("valide une étape dont les données sont complètes même si elle n'a jamais été enregistrée", () => {
    const statuses = getStatuses(
      createStructureVersionTransformation({
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion: { effectiveDate: "2026-09-11T12:00:00.000Z" },
        form: createTransformationForm({
          name: "structure-transformation-fermeture",
        }),
      })
    );

    expect(statuses).toEqual({
      [StructureVersionTransformationStep.DESCRIPTION]: StepStatus.VALIDE,
    });
  });

  it("repasse en commencée une étape enregistrée valide dont les données ne le sont plus", () => {
    const statuses = getStatuses(
      createStructureVersionTransformation({
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion: {},
        form: createTransformationForm({
          name: "structure-transformation-fermeture",
          validatedSlugs: ["01-identification"],
        }),
      })
    );

    expect(statuses).toEqual({
      [StructureVersionTransformationStep.DESCRIPTION]: StepStatus.COMMENCE,
    });
  });
});

describe("isStructureVersionTransformationComplete", () => {
  it("considère complète une structure dont toutes les étapes sont valides", () => {
    const structureVersionTransformation = createStructureVersionTransformation(
      {
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion: { effectiveDate: "2026-09-11T12:00:00.000Z" },
      }
    );

    expect(
      isStructureVersionTransformationComplete(
        createTransformation({
          structureVersionTransformations: [structureVersionTransformation],
        }),
        structureVersionTransformation
      )
    ).toBe(true);
  });

  it("considère incomplète une structure dont une étape n'est pas valide", () => {
    const structureVersionTransformation = createStructureVersionTransformation(
      {
        type: StructureVersionTransformationType.CREATION,
        structureVersion: {},
      }
    );

    expect(
      isStructureVersionTransformationComplete(
        createTransformation({
          structureVersionTransformations: [structureVersionTransformation],
        }),
        structureVersionTransformation
      )
    ).toBe(false);
  });
});
