import { describe, expect, it } from "vitest";

import {
  buildTransformationTypologie,
  getAdresseSource,
  getPlacesSource,
  getReferenceStructureVersionTransformation,
  getStructureVersionTransformationDepartement,
  getTransformationDefaultValues,
  getTransformationDepartement,
  getTransformationFormNavigation,
  getTransformationNounAvecArticle,
  getTransformationOriginRoute,
  getTransformationSteps,
  isCreation,
  isTransformationSurStructureExistante,
  setStructureVersionTransformationFormStepStatus,
  Step,
} from "@/app/utils/transformation.util";
import { FormApiType } from "@/schemas/api/form.schema";
import {
  StructureVersionApiRead,
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import { FormKind } from "@/types/global";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import {
  createStructureVersionTransformation,
  createTransformation,
} from "../test-utils/factories/transformation.factory";

describe("transformation util", () => {
  describe("getTransformationFormNavigation", () => {
    const transformationSteps: Step[] = [
      {
        id: 1,
        type: StructureVersionTransformationType.FERMETURE,
        steps: [
          {
            name: "description",
            label: "Description",
            route: "/structures/transformation/5/fermeture/1/description",
            status: StepStatus.NON_COMMENCE,
          },
        ],
      },
      {
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        steps: [
          {
            name: "description",
            label: "Description",
            route: "/structures/transformation/5/extension/2/description",
            status: StepStatus.NON_COMMENCE,
          },
          {
            name: "places-et-hebergement",
            label: "Places et hébergement",
            route:
              "/structures/transformation/5/extension/2/places-et-hebergement",
            status: StepStatus.NON_COMMENCE,
          },
          {
            name: "actes-administratifs",
            label: "Actes administratifs",
            route:
              "/structures/transformation/5/extension/2/actes-administratifs",
            status: StepStatus.NON_COMMENCE,
          },
        ],
      },
    ];

    it("should return defined prevStep and nextStep when step is in the middle of its group", () => {
      // GIVEN
      const transformationStructureType =
        StructureVersionTransformationType.EXTENSION;
      const transformationStructureId = 2;
      const transformationStructureStep = "places-et-hebergement";

      // WHEN
      const { firstStep, currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps,
          transformationId: 5,
          transformationStructureType,
          transformationStructureId,
          transformationStructureStep,
        });

      // THEN
      expect(firstStep).toMatchObject({
        id: 1,
        type: StructureVersionTransformationType.FERMETURE,
        name: "description",
      });
      expect(currentStep).toMatchObject({
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        name: "places-et-hebergement",
      });
      expect(prevStep).toMatchObject({
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        name: "description",
      });
      expect(nextStep).toMatchObject({
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        name: "actes-administratifs",
      });
    });

    it("should return undefined prevStep when step is the very first one", () => {
      // GIVEN
      const transformationStructureType =
        StructureVersionTransformationType.FERMETURE;
      const transformationStructureId = 1;
      const transformationStructureStep = "description";

      // WHEN
      const { currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps,
          transformationId: 5,
          transformationStructureType,
          transformationStructureId,
          transformationStructureStep,
        });

      // THEN
      expect(currentStep).toMatchObject({
        id: 1,
        type: StructureVersionTransformationType.FERMETURE,
        name: "description",
      });
      expect(prevStep).toBeUndefined();
      expect(nextStep).toMatchObject({
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        name: "description",
      });
    });

    it("should return the verification step as nextStep when on the last form step", () => {
      // GIVEN
      const transformationStructureType =
        StructureVersionTransformationType.EXTENSION;
      const transformationStructureId = 2;
      const transformationStructureStep = "actes-administratifs";

      // WHEN
      const { currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps,
          transformationId: 5,
          transformationStructureType,
          transformationStructureId,
          transformationStructureStep,
        });

      // THEN
      expect(currentStep).toMatchObject({
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        name: "actes-administratifs",
      });
      expect(prevStep).toMatchObject({
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        name: "places-et-hebergement",
      });
      expect(nextStep).toMatchObject({
        name: "verification",
        route: "/structures/transformation/5/verification",
      });
    });

    it("should resolve the verification step and expose the last form step as prevStep", () => {
      // WHEN
      const { currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps,
          transformationId: 5,
          transformationStructureStep: "verification",
        });

      // THEN
      expect(currentStep).toMatchObject({
        name: "verification",
        route: "/structures/transformation/5/verification",
      });
      expect(prevStep).toMatchObject({
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        name: "actes-administratifs",
      });
      expect(nextStep).toBeUndefined();
    });

    it("should compute prevStep from a previous group when crossing structureVersionTransformation boundaries", () => {
      // GIVEN
      const transformationStructureType =
        StructureVersionTransformationType.EXTENSION;
      const transformationStructureId = 2;
      const transformationStructureStep = "description";

      // WHEN
      const { prevStep, nextStep } = getTransformationFormNavigation({
        transformationSteps,
        transformationId: 5,
        transformationStructureType,
        transformationStructureId,
        transformationStructureStep,
      });

      // THEN
      expect(prevStep).toMatchObject({
        id: 1,
        type: StructureVersionTransformationType.FERMETURE,
        name: "description",
      });
      expect(nextStep).toMatchObject({
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        name: "places-et-hebergement",
      });
    });

    it("should return undefined currentStep/prevStep/nextStep when step is not found, but keep firstStep", () => {
      // GIVEN
      const transformationStructureType =
        StructureVersionTransformationType.EXTENSION;
      const transformationStructureId = 999;
      const transformationStructureStep = "description";

      // WHEN
      const { firstStep, currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps,
          transformationId: 5,
          transformationStructureType,
          transformationStructureId,
          transformationStructureStep,
        });

      // THEN
      expect(firstStep).toMatchObject({
        id: 1,
        type: StructureVersionTransformationType.FERMETURE,
        name: "description",
      });
      expect(currentStep).toBeUndefined();
      expect(prevStep).toBeUndefined();
      expect(nextStep).toBeUndefined();
    });

    it("should match the step type case-insensitively", () => {
      // GIVEN
      const transformationStructureType =
        "fermeture" as unknown as StructureVersionTransformationType;
      const transformationStructureId = 1;
      const transformationStructureStep = "description";

      // WHEN
      const { currentStep } = getTransformationFormNavigation({
        transformationSteps,
        transformationId: 5,
        transformationStructureType,
        transformationStructureId,
        transformationStructureStep,
      });

      // THEN
      expect(currentStep).toMatchObject({
        id: 1,
        type: StructureVersionTransformationType.FERMETURE,
        name: "description",
      });
    });

    it("should return only the verification step as firstStep when transformationSteps is empty", () => {
      // GIVEN
      const emptySteps: Step[] = [];

      // WHEN
      const { firstStep, currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps: emptySteps,
          transformationId: 5,
          transformationStructureType:
            StructureVersionTransformationType.EXTENSION,
          transformationStructureId: 2,
          transformationStructureStep: "description",
        });

      // THEN
      expect(firstStep).toMatchObject({
        name: "verification",
        route: "/structures/transformation/5/verification",
      });
      expect(currentStep).toBeUndefined();
      expect(prevStep).toBeUndefined();
      expect(nextStep).toBeUndefined();
    });
  });

  describe("getTransformationSteps", () => {
    it("should return an empty array when transformation is undefined", () => {
      // WHEN
      const result = getTransformationSteps(undefined);

      // THEN
      expect(result).toEqual([]);
    });

    it("should return an empty array when transformation has no structureVersionTransformations", () => {
      // GIVEN
      const transformation: TransformationApiRead = {
        id: 5,
        type: TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
        structureVersionTransformations: [],
      };

      // WHEN
      const result = getTransformationSteps(transformation);

      // THEN
      expect(result).toEqual([]);
    });

    it("should sort structure transformations FERMETURE → CONTRACTION → EXTENSION → CREATION", () => {
      // GIVEN
      const transformation: TransformationApiRead = {
        id: 5,
        structureVersionTransformations: [
          {
            id: 1,
            structureVersion: { structureId: 1001 },
            type: StructureVersionTransformationType.FERMETURE,
          },
          {
            id: 2,
            structureVersion: { structureId: 1003 },
            type: StructureVersionTransformationType.EXTENSION,
          },
          {
            id: 3,
            structureVersion: { structureId: 1002 },
            type: StructureVersionTransformationType.FERMETURE,
          },
          {
            id: 4,
            structureVersion: { structureId: 1003 },
            type: StructureVersionTransformationType.CONTRACTION,
          },
          {
            id: 5,
            structureVersion: { structureId: 1004 },
            type: StructureVersionTransformationType.CREATION,
          },
        ],
      };

      // WHEN
      const result = getTransformationSteps(transformation);

      // THEN
      expect(result.map((step) => step.type)).toEqual([
        StructureVersionTransformationType.FERMETURE,
        StructureVersionTransformationType.FERMETURE,
        StructureVersionTransformationType.CONTRACTION,
        StructureVersionTransformationType.EXTENSION,
        StructureVersionTransformationType.CREATION,
      ]);
    });

    it("should return only the 'description' step for FERMETURE", () => {
      // GIVEN
      const transformation: TransformationApiRead = {
        id: 5,
        structureVersionTransformations: [
          {
            id: 1,
            structureVersion: { structureId: 1001 },
            type: StructureVersionTransformationType.FERMETURE,
          },
        ],
      };

      // WHEN
      const result = getTransformationSteps(transformation);

      // THEN
      expect(result).toHaveLength(1);
      expect(result[0].steps.map((step) => step.name)).toEqual(["description"]);
    });

    it.each([
      StructureVersionTransformationType.EXTENSION,
      StructureVersionTransformationType.CONTRACTION,
      StructureVersionTransformationType.CREATION,
    ])(
      "should return the description / places-et-hebergement / actes-administratifs steps for %s",
      (type) => {
        // GIVEN
        const transformation: TransformationApiRead = {
          id: 5,
          structureVersionTransformations: [
            { id: 1, structureVersion: { structureId: 1001 }, type },
          ],
        };

        // WHEN
        const result = getTransformationSteps(transformation);

        // THEN
        expect(result).toHaveLength(1);
        expect(result[0].steps.map((step) => step.name)).toEqual([
          "description",
          "places-et-hebergement",
          "actes-administratifs",
        ]);
      }
    );

    it("carries each form step status read from the structureVersionTransformation form", () => {
      // GIVEN — an extension whose form has only the description step validated
      const transformation: TransformationApiRead = {
        id: 5,
        structureVersionTransformations: [
          {
            id: 1,
            type: StructureVersionTransformationType.EXTENSION,
            structureVersion: { structureId: 1001 },
            form: {
              id: 100,
              status: false,
              formDefinition: {
                id: 10,
                name: "structure-transformation-extension",
                slug: "structure-transformation-extension-v1",
                version: 1,
              },
              formSteps: [
                {
                  id: 1001,
                  status: StepStatus.VALIDE,
                  stepDefinition: {
                    id: 201,
                    slug: "01-identification",
                    label: "Description",
                  },
                },
                {
                  id: 1002,
                  status: StepStatus.NON_COMMENCE,
                  stepDefinition: {
                    id: 202,
                    slug: "02-places-hebergement",
                    label: "Places et hébergement",
                  },
                },
                {
                  id: 1003,
                  status: StepStatus.NON_COMMENCE,
                  stepDefinition: {
                    id: 203,
                    slug: "03-actes-administratifs",
                    label: "Actes administratifs",
                  },
                },
              ],
            },
          } as StructureVersionTransformationApiRead,
        ],
      };

      // WHEN
      const result = getTransformationSteps(transformation);

      // THEN
      expect(result[0].steps.map((step) => step.status)).toEqual([
        StepStatus.VALIDE,
        StepStatus.NON_COMMENCE,
        StepStatus.NON_COMMENCE,
      ]);
    });

    it("defaults each step status to NON_COMMENCE when the form is absent", () => {
      // GIVEN
      const transformation: TransformationApiRead = {
        id: 5,
        structureVersionTransformations: [
          {
            id: 1,
            type: StructureVersionTransformationType.FERMETURE,
            structureVersion: { structureId: 1001 },
          },
        ],
      };

      // WHEN
      const result = getTransformationSteps(transformation);

      // THEN
      expect(result[0].steps[0].status).toBe(StepStatus.NON_COMMENCE);
    });
  });

  describe("getRoute (tested indirectly via getTransformationSteps)", () => {
    it.each([
      [StructureVersionTransformationType.EXTENSION, "extension"],
      [StructureVersionTransformationType.CONTRACTION, "contraction"],
      [StructureVersionTransformationType.FERMETURE, "fermeture"],
      [StructureVersionTransformationType.CREATION, "creation"],
    ])(
      "should build routes with the URL segment '%s' for %s",
      (type, urlSegment) => {
        // GIVEN
        const transformation: TransformationApiRead = {
          id: 5,
          structureVersionTransformations: [
            { id: 42, structureVersion: { structureId: 1001 }, type },
          ],
        };

        // WHEN
        const result = getTransformationSteps(transformation);

        // THEN
        for (const step of result[0].steps) {
          expect(step.route).toBe(
            `/structures/transformation/5/${urlSegment}/42/${step.name}`
          );
        }
      }
    );

    it("should build the full route pattern transformationId / type / idStep / step name", () => {
      // GIVEN
      const transformation: TransformationApiRead = {
        id: 7,
        structureVersionTransformations: [
          {
            id: 13,
            structureVersion: { structureId: 1001 },
            type: StructureVersionTransformationType.EXTENSION,
          },
        ],
      };

      // WHEN
      const result = getTransformationSteps(transformation);

      // THEN
      expect(result[0].steps.map((step) => step.route)).toEqual([
        "/structures/transformation/7/extension/13/description",
        "/structures/transformation/7/extension/13/places-et-hebergement",
        "/structures/transformation/7/extension/13/actes-administratifs",
      ]);
    });

    it("should return empty routes when structureVersionTransformation has no id", () => {
      // GIVEN
      const transformation: TransformationApiRead = {
        id: 5,
        structureVersionTransformations: [
          {
            id: undefined,
            structureVersion: { structureId: 1001 },
            type: StructureVersionTransformationType.EXTENSION,
          },
        ],
      };

      // WHEN
      const result = getTransformationSteps(transformation);

      // THEN
      expect(result[0].steps.map((step) => step.route)).toEqual(["", "", ""]);
    });
  });

  describe("getTransformationOriginRoute", () => {
    it.each([
      [
        TransformationType.EXTENSION_EX_NIHILO,
        StructureVersionTransformationType.EXTENSION,
      ],
      [
        TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES,
        StructureVersionTransformationType.CONTRACTION,
      ],
      [
        TransformationType.FERMETURE_SANS_TRANSFERT,
        StructureVersionTransformationType.FERMETURE,
      ],
    ])(
      "returns the impacted structure page for %s",
      (transformationType, primaryType) => {
        // GIVEN
        const transformation = createTransformation({
          id: 5,
          type: transformationType,
          structureVersionTransformations: [
            {
              id: 1,
              type: primaryType,
              structureVersion: { structureId: 1001 },
            } as StructureVersionTransformationApiRead,
          ],
        });

        // THEN
        expect(getTransformationOriginRoute(transformation)).toBe(
          "/structures/1001"
        );
      }
    );

    it("picks the primary type's structure when several structureVersionTransformations exist", () => {
      // GIVEN — a contraction with transfer: 1 contraction (primary) + 1 extension target
      const transformation = createTransformation({
        id: 5,
        type: TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE,
        structureVersionTransformations: [
          {
            id: 1,
            type: StructureVersionTransformationType.EXTENSION,
            structureVersion: { structureId: 2002 },
          } as StructureVersionTransformationApiRead,
          {
            id: 2,
            type: StructureVersionTransformationType.CONTRACTION,
            structureVersion: { structureId: 3003 },
          } as StructureVersionTransformationApiRead,
        ],
      });

      // THEN — the contraction's structure, not the extension's
      expect(getTransformationOriginRoute(transformation)).toBe(
        "/structures/3003"
      );
    });

    it.each([
      TransformationType.OUVERTURE_EX_NIHILO,
      TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES,
    ])("returns /structures for %s (no primary type)", (transformationType) => {
      // GIVEN
      const transformation = createTransformation({
        id: 5,
        type: transformationType,
        structureVersionTransformations: [
          {
            id: 1,
            type: StructureVersionTransformationType.CREATION,
            structureVersion: { structureId: 1001 },
          } as StructureVersionTransformationApiRead,
        ],
      });

      // THEN
      expect(getTransformationOriginRoute(transformation)).toBe("/structures");
    });

    it("falls back to /structures when the primary structureVersionTransformation has no structureId", () => {
      // GIVEN
      const transformation = createTransformation({
        id: 5,
        type: TransformationType.EXTENSION_EX_NIHILO,
        structureVersionTransformations: [
          {
            id: 1,
            type: StructureVersionTransformationType.EXTENSION,
          } as StructureVersionTransformationApiRead,
        ],
      });

      // THEN
      expect(getTransformationOriginRoute(transformation)).toBe("/structures");
    });
  });

  describe("setStructureVersionTransformationFormStepStatus", () => {
    const buildCreationForm = (validatedSlugs: string[] = []): FormApiType => ({
      id: 100,
      status: false,
      formDefinition: {
        id: 10,
        name: "structure-transformation-creation",
        slug: "structure-transformation-creation-v1",
        version: 1,
      },
      formSteps: [
        {
          id: 1001,
          status: validatedSlugs.includes("01-identification")
            ? StepStatus.VALIDE
            : StepStatus.NON_COMMENCE,
          stepDefinition: {
            id: 201,
            slug: "01-identification",
            label: "Description",
          },
        },
        {
          id: 1002,
          status: validatedSlugs.includes("02-places-hebergement")
            ? StepStatus.VALIDE
            : StepStatus.NON_COMMENCE,
          stepDefinition: {
            id: 202,
            slug: "02-places-hebergement",
            label: "Places et hébergement",
          },
        },
        {
          id: 1003,
          status: validatedSlugs.includes("03-actes-administratifs")
            ? StepStatus.VALIDE
            : StepStatus.NON_COMMENCE,
          stepDefinition: {
            id: 203,
            slug: "03-actes-administratifs",
            label: "Actes administratifs",
          },
        },
      ],
    });

    it("flips only the targeted route step to the given status, mapping it to its form step slug", () => {
      const form = setStructureVersionTransformationFormStepStatus(
        buildCreationForm(),
        StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
        StepStatus.VALIDE
      );

      const statusBySlug = Object.fromEntries(
        form.formSteps.map((formStep) => [
          formStep.stepDefinition.slug,
          formStep.status,
        ])
      );
      expect(statusBySlug).toEqual({
        "01-identification": StepStatus.NON_COMMENCE,
        "02-places-hebergement": StepStatus.NON_COMMENCE,
        "03-actes-administratifs": StepStatus.VALIDE,
      });
    });

    it("maps the description route step to the 01-identification form step", () => {
      const form = setStructureVersionTransformationFormStepStatus(
        buildCreationForm(),
        StructureVersionTransformationStep.DESCRIPTION,
        StepStatus.VALIDE
      );

      const identificationStep = form.formSteps.find(
        (formStep) => formStep.stepDefinition.slug === "01-identification"
      );
      expect(identificationStep?.status).toBe(StepStatus.VALIDE);
    });

    it("downgrades a previously validated step when the given status is COMMENCE", () => {
      const form = setStructureVersionTransformationFormStepStatus(
        buildCreationForm(["01-identification"]),
        StructureVersionTransformationStep.DESCRIPTION,
        StepStatus.COMMENCE
      );

      const identificationStep = form.formSteps.find(
        (formStep) => formStep.stepDefinition.slug === "01-identification"
      );
      expect(identificationStep?.status).toBe(StepStatus.COMMENCE);
      expect(form.status).toBe(false);
    });

    it("preserves the form and step ids read from the database", () => {
      const form = setStructureVersionTransformationFormStepStatus(
        buildCreationForm(),
        StructureVersionTransformationStep.DESCRIPTION,
        StepStatus.VALIDE
      );

      expect(form.id).toBe(100);
      expect(form.formDefinition.id).toBe(10);
      expect(form.formSteps.map((formStep) => formStep.id)).toEqual([
        1001, 1002, 1003,
      ]);
    });

    it("returns the form unchanged when the step does not belong to the form", () => {
      const form = buildCreationForm();
      // a fermeture form only exposes the description step
      form.formDefinition.name = "structure-transformation-fermeture";

      const result = setStructureVersionTransformationFormStepStatus(
        form,
        StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
        StepStatus.VALIDE
      );

      expect(
        result.formSteps.every(
          (formStep) => formStep.status === StepStatus.NON_COMMENCE
        )
      ).toBe(true);
    });

    it("returns the form unchanged for an unknown form name", () => {
      const form = buildCreationForm();
      form.formDefinition.name = "unknown-form";

      const result = setStructureVersionTransformationFormStepStatus(
        form,
        StructureVersionTransformationStep.DESCRIPTION,
        StepStatus.VALIDE
      );

      expect(
        result.formSteps.every(
          (formStep) => formStep.status === StepStatus.NON_COMMENCE
        )
      ).toBe(true);
    });

    it("sets the form status to true once the last remaining step is validated", () => {
      const form = setStructureVersionTransformationFormStepStatus(
        buildCreationForm(["01-identification", "02-places-hebergement"]),
        StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
        StepStatus.VALIDE
      );

      expect(
        form.formSteps.every(
          (formStep) => formStep.status === StepStatus.VALIDE
        )
      ).toBe(true);
      expect(form.status).toBe(true);
    });

    it("keeps the form status false while at least one step is not validated", () => {
      const form = setStructureVersionTransformationFormStepStatus(
        buildCreationForm(["01-identification"]),
        StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT,
        StepStatus.VALIDE
      );

      expect(form.status).toBe(false);
    });
  });

  describe("isCreation", () => {
    it.each([
      [FormKind.OUVERTURE_EX_NIHILO, true],
      [FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES, true],
      [FormKind.EXTENSION, false],
      [FormKind.CONTRACTION, false],
      [FormKind.MODIFICATION, false],
      [FormKind.FINALISATION, false],
    ])("returns %s → %s", (formKind, expected) => {
      expect(isCreation(formKind)).toBe(expected);
    });
  });

  describe("isTransformationSurStructureExistante", () => {
    it.each([
      [FormKind.EXTENSION, true],
      [FormKind.CONTRACTION, true],
      [FormKind.OUVERTURE_EX_NIHILO, false],
      [FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES, false],
      [FormKind.MODIFICATION, false],
      [FormKind.FINALISATION, false],
    ])("returns %s → %s", (formKind, expected) => {
      expect(isTransformationSurStructureExistante(formKind)).toBe(expected);
    });
  });

  describe("getAdresseSource", () => {
    it("projette l'adresse de la structure source (stable, pré-transformation)", () => {
      const structureVersionTransformation: StructureVersionTransformationApiRead =
        {
          id: 1,
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: {
            structure: {
              codeBhasile: "BHA-NOR-001",
              nom: "Les Mimosas",
              adresseAdministrative: "58 boulevard Vauban",
              adresseAdministrativeComplete:
                "58 boulevard Vauban 50300 Avranches",
              codePostalAdministratif: "50300",
              communeAdministrative: "Avranches",
              departementAdministratif: "50",
            },
          },
        };

      expect(getAdresseSource(structureVersionTransformation)).toEqual({
        nom: "Les Mimosas",
        adresseAdministrative: "58 boulevard Vauban",
        adresseAdministrativeComplete: "58 boulevard Vauban 50300 Avranches",
        codePostalAdministratif: "50300",
        communeAdministrative: "Avranches",
        departementAdministratif: "50",
      });
    });

    it("normalise les champs absents en chaîne vide", () => {
      const structureVersionTransformation: StructureVersionTransformationApiRead =
        {
          id: 1,
          type: StructureVersionTransformationType.EXTENSION,
        };

      expect(getAdresseSource(structureVersionTransformation)).toEqual({
        nom: "",
        adresseAdministrative: "",
        adresseAdministrativeComplete: "",
        codePostalAdministratif: "",
        communeAdministrative: "",
        departementAdministratif: "",
      });
    });
  });

  describe("getPlacesSource", () => {
    it("retourne placesAutorisees de la typologie source correspondant à l'année de l'effectiveDate", () => {
      const structureVersionTransformation: StructureVersionTransformationApiRead =
        {
          id: 1,
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: {
            effectiveDate: "2025-08-25T12:00:00.000Z",
            structure: {
              codeBhasile: "BHA-NOR-001",
              structureTypologies: [
                { year: 2026, placesAutorisees: 47 },
                { year: 2025, placesAutorisees: 40 },
              ],
            },
          },
        };

      expect(getPlacesSource(structureVersionTransformation)).toBe(40);
    });

    it("retombe sur la typologie la plus récente quand aucune ne correspond à l'année de l'effectiveDate", () => {
      const structureVersionTransformation: StructureVersionTransformationApiRead =
        {
          id: 1,
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: {
            effectiveDate: "2027-01-01T12:00:00.000Z",
            structure: {
              codeBhasile: "BHA-NOR-001",
              structureTypologies: [
                { year: 2026, placesAutorisees: 47 },
                { year: 2025, placesAutorisees: 40 },
              ],
            },
          },
        };

      expect(getPlacesSource(structureVersionTransformation)).toBe(47);
    });

    it("retombe sur la typologie la plus récente (max year, pas [0]) quand l'ordre n'est pas décroissant", () => {
      const structureVersionTransformation: StructureVersionTransformationApiRead =
        {
          id: 1,
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: {
            effectiveDate: "2030-01-01T12:00:00.000Z",
            structure: {
              codeBhasile: "BHA-NOR-001",
              structureTypologies: [
                { year: 2024, placesAutorisees: 40 },
                { year: 2026, placesAutorisees: 50 },
                { year: 2025, placesAutorisees: 47 },
              ],
            },
          },
        };

      expect(getPlacesSource(structureVersionTransformation)).toBe(50);
    });

    it("retombe sur la typologie la plus récente quand effectiveDate est absente", () => {
      const structureVersionTransformation: StructureVersionTransformationApiRead =
        {
          id: 1,
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: {
            structure: {
              codeBhasile: "BHA-NOR-001",
              structureTypologies: [
                { year: 2026, placesAutorisees: 47 },
                { year: 2025, placesAutorisees: 40 },
              ],
            },
          },
        };

      expect(getPlacesSource(structureVersionTransformation)).toBe(47);
    });

    it("retourne 0 quand la structure source n'a pas de typologie", () => {
      const structureVersionTransformation: StructureVersionTransformationApiRead =
        {
          id: 1,
          type: StructureVersionTransformationType.EXTENSION,
        };

      expect(getPlacesSource(structureVersionTransformation)).toBe(0);
    });
  });

  describe("buildTransformationTypologie", () => {
    it("date le typologie à l'année de l'effectiveDate et le préremplit depuis la typologie source de cette année", () => {
      const structureVersion = {
        effectiveDate: "2025-08-25T12:00:00.000Z",
        structureTypologies: [
          { year: 2026, placesAutorisees: 50, pmr: 3, lgbt: 2, fvvTeh: 1 },
          { year: 2025, placesAutorisees: 47, pmr: 2, lgbt: 1, fvvTeh: 0 },
          { year: 2024, placesAutorisees: 40, pmr: 1, lgbt: 0, fvvTeh: 0 },
        ],
      } as StructureVersionApiRead;

      expect(buildTransformationTypologie(structureVersion)).toEqual({
        year: 2025,
        placesAutorisees: 47,
        pmr: 2,
        lgbt: 1,
        fvvTeh: 0,
      });
    });

    it("retombe sur la typologie la plus récente quand aucune ne correspond à l'année de l'effectiveDate", () => {
      const structureVersion = {
        effectiveDate: "2026-08-25T12:00:00.000Z",
        structureTypologies: [
          { year: 2025, placesAutorisees: 47, pmr: 2, lgbt: 1, fvvTeh: 0 },
          { year: 2024, placesAutorisees: 40, pmr: 1, lgbt: 0, fvvTeh: 0 },
        ],
      } as StructureVersionApiRead;

      expect(buildTransformationTypologie(structureVersion)).toEqual({
        year: 2026,
        placesAutorisees: 47,
        pmr: 2,
        lgbt: 1,
        fvvTeh: 0,
      });
    });

    it("utilise l'année réelle en cours quand effectiveDate est absente, préremplie depuis la typologie la plus récente", () => {
      const structureVersion = {
        structureTypologies: [
          { year: 2025, placesAutorisees: 47, pmr: 2, lgbt: 1, fvvTeh: 0 },
          { year: 2024, placesAutorisees: 40, pmr: 1, lgbt: 0, fvvTeh: 0 },
        ],
      } as StructureVersionApiRead;

      expect(buildTransformationTypologie(structureVersion)).toEqual({
        year: new Date().getFullYear(),
        placesAutorisees: 47,
        pmr: 2,
        lgbt: 1,
        fvvTeh: 0,
      });
    });

    it("prérempli depuis la typologie la plus récente (max year, pas typologies[0]) quand l'ordre n'est pas décroissant", () => {
      const structureVersion = {
        effectiveDate: "2030-01-01T12:00:00.000Z",
        structureTypologies: [
          { year: 2024, placesAutorisees: 40, pmr: 1, lgbt: 0, fvvTeh: 0 },
          { year: 2026, placesAutorisees: 50, pmr: 3, lgbt: 2, fvvTeh: 1 },
          { year: 2025, placesAutorisees: 47, pmr: 2, lgbt: 1, fvvTeh: 0 },
        ],
      } as StructureVersionApiRead;

      expect(buildTransformationTypologie(structureVersion)).toEqual({
        year: 2030,
        placesAutorisees: 50,
        pmr: 3,
        lgbt: 2,
        fvvTeh: 1,
      });
    });

    it("retombe sur l'année réelle en cours sans effectiveDate ni typologie source (structureVersion absente)", () => {
      expect(buildTransformationTypologie(undefined)).toEqual({
        year: new Date().getFullYear(),
        placesAutorisees: undefined,
        pmr: undefined,
        lgbt: undefined,
        fvvTeh: undefined,
      });
    });

    it("retombe sur l'année réelle en cours pour une création ex-nihilo (typologies vides, pas d'effectiveDate)", () => {
      const structureVersion = {
        structureTypologies: [],
      } as StructureVersionApiRead;

      expect(buildTransformationTypologie(structureVersion)).toEqual({
        year: new Date().getFullYear(),
        placesAutorisees: undefined,
        pmr: undefined,
        lgbt: undefined,
        fvvTeh: undefined,
      });
    });
  });

  describe("getTransformationDefaultValues", () => {
    type DefaultValues = {
      operateur?: { id: number; name: string };
      isMultiAntenne?: boolean;
      structureTypologies?: {
        year: number;
        placesAutorisees: number | null;
        pmr: number | null;
        lgbt: number | null;
        fvvTeh: number | null;
      }[];
      actesAdministratifs?: { category: string }[];
    };

    const buildStructureVersionTransformation = (
      type: StructureVersionTransformationType
    ): StructureVersionTransformationApiRead => ({
      id: 1,
      type,
      operateur: { id: 9, name: "Opérateur Test" },
      structureVersion: {
        isMultiAntenne: true,
        antennes: [],
        effectiveDate: "2025-08-25T12:00:00.000Z",
        adresses: [],
        structureTypologies: [
          { year: 2025, placesAutorisees: 47, pmr: 2, lgbt: 1, fvvTeh: 0 },
        ],
      } as StructureVersionApiRead,
    });

    const getDefaultValuesFor = (
      type: StructureVersionTransformationType
    ): DefaultValues =>
      getTransformationDefaultValues({
        transformation: createTransformation(),
        structureVersionTransformation:
          buildStructureVersionTransformation(type),
      }) as DefaultValues;

    it("passe operateur depuis la structureVersionTransformation", () => {
      expect(
        getDefaultValuesFor(StructureVersionTransformationType.EXTENSION)
          .operateur
      ).toEqual({ id: 9, name: "Opérateur Test" });
    });

    it("utilise isMultiAntenne porté par le spread (valeur serveur) sans le recalculer depuis antennes", () => {
      // structureVersion.isMultiAntenne vaut true alors que antennes est vide :
      // on doit obtenir true, ce qui prouve qu'on ne recalcule plus côté client.
      expect(
        getDefaultValuesFor(StructureVersionTransformationType.EXTENSION)
          .isMultiAntenne
      ).toBe(true);
    });

    it("résout structureTypologies pour l'année de l'effectiveDate", () => {
      expect(
        getDefaultValuesFor(StructureVersionTransformationType.EXTENSION)
          .structureTypologies
      ).toEqual([
        { year: 2025, placesAutorisees: 47, pmr: 2, lgbt: 1, fvvTeh: 0 },
      ]);
    });

    it("calcule les actesAdministratifs avec les règles de catégorie de la fermeture", () => {
      const categories = getDefaultValuesFor(
        StructureVersionTransformationType.FERMETURE
      ).actesAdministratifs?.map(
        (acteAdministratif) => acteAdministratif.category
      );

      expect(categories).toEqual(["AUTRE"]);
    });

    it("calcule les actesAdministratifs avec les règles de catégorie de l'extension", () => {
      const categories = getDefaultValuesFor(
        StructureVersionTransformationType.EXTENSION
      ).actesAdministratifs?.map(
        (acteAdministratif) => acteAdministratif.category
      );

      expect(categories?.slice().sort()).toEqual(
        ["ARRETE_EXTENSION", "AUTRE", "CONVENTION"].sort()
      );
    });
  });

  describe("getTransformationNounAvecArticle", () => {
    it.each([
      [FormKind.EXTENSION, "l’extension"],
      [FormKind.CONTRACTION, "la contraction"],
      [FormKind.OUVERTURE_EX_NIHILO, ""],
      [FormKind.FINALISATION, ""],
    ])("returns %s → '%s'", (formKind, expected) => {
      expect(getTransformationNounAvecArticle(formKind)).toBe(expected);
    });
  });
});

describe("getReferenceStructureVersionTransformation", () => {
  it("retourne la première structureVersionTransformation qui a un département", () => {
    const sansDepartement = createStructureVersionTransformation({ id: 1 });
    const avecDepartement = createStructureVersionTransformation({
      id: 2,
      structureVersion: { departementAdministratif: "50" },
    });
    const transformation = createTransformation({
      structureVersionTransformations: [sansDepartement, avecDepartement],
    });

    expect(getReferenceStructureVersionTransformation(transformation)).toBe(
      avecDepartement
    );
  });

  it("retombe sur la première structureVersionTransformation quand aucune n'a de département", () => {
    const premiere = createStructureVersionTransformation({ id: 1 });
    const seconde = createStructureVersionTransformation({ id: 2 });
    const transformation = createTransformation({
      structureVersionTransformations: [premiere, seconde],
    });

    expect(getReferenceStructureVersionTransformation(transformation)).toBe(
      premiere
    );
  });
});

describe("getTransformationDepartement", () => {
  it("résout le département via la structure liée de la structureVersionTransformation de référence", () => {
    const transformation = createTransformation({
      structureVersionTransformations: [
        createStructureVersionTransformation({ id: 1 }),
        createStructureVersionTransformation({
          id: 2,
          structureVersion: {
            structure: { codeBhasile: "ABC", departementAdministratif: "13" },
          },
        }),
      ],
    });

    expect(getTransformationDepartement(transformation)).toBe("13");
  });

  it("retourne undefined quand aucune structureVersionTransformation n'a de département", () => {
    const transformation = createTransformation({
      structureVersionTransformations: [createStructureVersionTransformation()],
    });

    expect(getTransformationDepartement(transformation)).toBeUndefined();
  });
});

describe("getStructureVersionTransformationDepartement", () => {
  it("retourne le département de la structureVersion quand il est présent", () => {
    const structureVersionTransformation = createStructureVersionTransformation(
      {
        structureVersion: { departementAdministratif: "50" },
      }
    );

    expect(
      getStructureVersionTransformationDepartement(
        structureVersionTransformation
      )
    ).toBe("50");
  });

  it("retombe sur le département de la structure liée quand la version n'en a pas", () => {
    const structureVersionTransformation = createStructureVersionTransformation(
      {
        structureVersion: {
          structure: { codeBhasile: "ABC", departementAdministratif: "13" },
        },
      }
    );

    expect(
      getStructureVersionTransformationDepartement(
        structureVersionTransformation
      )
    ).toBe("13");
  });

  it("retourne undefined quand ni la version ni la structure n'ont de département", () => {
    const structureVersionTransformation =
      createStructureVersionTransformation();

    expect(
      getStructureVersionTransformationDepartement(
        structureVersionTransformation
      )
    ).toBeUndefined();
  });
});
