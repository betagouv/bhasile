import { describe, expect, it } from "vitest";

import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import { StructureType } from "@/types/structure.type";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";
import { getTransformationStepsWithStatus } from "@/utils/transformation-step-status.util";

import {
  createStructureVersionTransformation,
  createTransformation,
  createTransformationForm,
} from "../test-utils/factories/transformation.factory";

const getStatuses = (
  structureVersionTransformation: StructureVersionTransformationApiRead,
  canUpdateDepartement: (departementAdministratif: string) => boolean = () =>
    true
) =>
  Object.fromEntries(
    getTransformationStepsWithStatus(
      createTransformation({
        type: TransformationType.OUVERTURE_EX_NIHILO,
        structureVersionTransformations: [structureVersionTransformation],
      }),
      canUpdateDepartement
    )[0].steps.map((stepItem) => [stepItem.name, stepItem.status])
  );

describe("getTransformationStepsWithStatus", () => {
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
      })
    );

    expect(statuses[StructureVersionTransformationStep.DESCRIPTION]).toBe(
      StepStatus.VALIDE
    );
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

    expect(statuses[StructureVersionTransformationStep.DESCRIPTION]).toBe(
      StepStatus.COMMENCE
    );
  });

  it("ne valide une description complète que si son adresse est dans le périmètre de l'agent", () => {
    const extension = createStructureVersionTransformation({
      type: StructureVersionTransformationType.EXTENSION,
      structureType: StructureType.CADA,
      structureVersion: {
        effectiveDate: "2026-09-11T12:00:00.000Z",
        adresseAdministrative: "12 Rue des Lilas",
        codePostalAdministratif: "40000",
        communeAdministrative: "Mont-de-Marsan",
        departementAdministratif: "40",
        antennes: [],
        dnaStructures: [{ dna: { code: "K-803" } }],
        contacts: [
          {
            prenom: "Camille",
            nom: "Martin",
            role: "Directrice",
            email: "camille.martin@example.fr",
            telephone: "0102030405",
          },
        ],
      },
    });
    const getDescriptionStatus = (departementsInPerimetre: string[]) =>
      getStatuses(extension, (departementAdministratif) =>
        departementsInPerimetre.includes(departementAdministratif)
      )[StructureVersionTransformationStep.DESCRIPTION];

    expect(getDescriptionStatus(["40"])).toBe(StepStatus.VALIDE);
    expect(getDescriptionStatus(["75"])).not.toBe(StepStatus.VALIDE);
  });
});
