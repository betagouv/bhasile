import { describe, expect, it } from "vitest";

import { StepStatus } from "@/types/form.type";
import { StructureType } from "@/types/structure.type";
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

const allowAllDepartements = () => true;

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
      structureVersionTransformation,
      allowAllDepartements
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

describe("statut de la description selon le périmètre", () => {
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

  const getDescriptionStatus = (
    canUpdateDepartement: (departementAdministratif: string) => boolean
  ) =>
    getStructureVersionTransformationStepItems(
      createTransformation({ structureVersionTransformations: [extension] }),
      extension,
      canUpdateDepartement
    ).find(
      (stepItem) =>
        stepItem.name === StructureVersionTransformationStep.DESCRIPTION
    )?.status;

  it("valide une description complète dans le périmètre de l'agent", () => {
    expect(getDescriptionStatus(() => true)).toBe(StepStatus.VALIDE);
  });

  it("ne valide pas une description complète dont l'adresse est hors périmètre", () => {
    expect(
      getDescriptionStatus(
        (departementAdministratif) => departementAdministratif === "75"
      )
    ).not.toBe(StepStatus.VALIDE);
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
        structureVersionTransformation,
        allowAllDepartements
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
        structureVersionTransformation,
        allowAllDepartements
      )
    ).toBe(false);
  });
});
