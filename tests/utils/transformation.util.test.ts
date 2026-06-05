import { describe, expect, it } from "vitest";

import {
  buildTransformationTypologie,
  getAdresseSource,
  getPlacesSource,
  getTransformationFormNavigation,
  getTransformationNounAvecArticle,
  getTransformationSteps,
  isCreation,
  isTransformationSurStructureExistante,
  Step,
  validateStructureTransformationFormStep,
} from "@/app/utils/transformation.util";
import { FormApiType } from "@/schemas/api/form.schema";
import {
  StructureTransformationApiRead,
  StructureVersionApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import { FormKind } from "@/types/global";
import {
  StructureTransformationStep,
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

describe("transformation util", () => {
  describe("getTransformationFormNavigation", () => {
    const transformationSteps: Step[] = [
      {
        id: 1,
        type: StructureTransformationType.FERMETURE,
        steps: [
          {
            name: "description",
            label: "Description",
            route: "/structures/transformation/5/fermeture/1/description",
          },
        ],
      },
      {
        id: 2,
        type: StructureTransformationType.EXTENSION,
        steps: [
          {
            name: "description",
            label: "Description",
            route: "/structures/transformation/5/extension/2/description",
          },
          {
            name: "places-et-hebergement",
            label: "Places et hébergement",
            route:
              "/structures/transformation/5/extension/2/places-et-hebergement",
          },
          {
            name: "actes-administratifs",
            label: "Actes administratifs",
            route:
              "/structures/transformation/5/extension/2/actes-administratifs",
          },
        ],
      },
    ];

    it("should return defined prevStep and nextStep when step is in the middle of its group", () => {
      // GIVEN
      const transformationStructureType = StructureTransformationType.EXTENSION;
      const transformationStructureId = 2;
      const transformationStructureStep = "places-et-hebergement";

      // WHEN
      const { firstStep, currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps,
          transformationStructureType,
          transformationStructureId,
          transformationStructureStep,
        });

      // THEN
      expect(firstStep).toMatchObject({
        id: 1,
        type: StructureTransformationType.FERMETURE,
        name: "description",
      });
      expect(currentStep).toMatchObject({
        id: 2,
        type: StructureTransformationType.EXTENSION,
        name: "places-et-hebergement",
      });
      expect(prevStep).toMatchObject({
        id: 2,
        type: StructureTransformationType.EXTENSION,
        name: "description",
      });
      expect(nextStep).toMatchObject({
        id: 2,
        type: StructureTransformationType.EXTENSION,
        name: "actes-administratifs",
      });
    });

    it("should return undefined prevStep when step is the very first one", () => {
      // GIVEN
      const transformationStructureType = StructureTransformationType.FERMETURE;
      const transformationStructureId = 1;
      const transformationStructureStep = "description";

      // WHEN
      const { currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps,
          transformationStructureType,
          transformationStructureId,
          transformationStructureStep,
        });

      // THEN
      expect(currentStep).toMatchObject({
        id: 1,
        type: StructureTransformationType.FERMETURE,
        name: "description",
      });
      expect(prevStep).toBeUndefined();
      expect(nextStep).toMatchObject({
        id: 2,
        type: StructureTransformationType.EXTENSION,
        name: "description",
      });
    });

    it("should return undefined nextStep when step is the very last one", () => {
      // GIVEN
      const transformationStructureType = StructureTransformationType.EXTENSION;
      const transformationStructureId = 2;
      const transformationStructureStep = "actes-administratifs";

      // WHEN
      const { currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps,
          transformationStructureType,
          transformationStructureId,
          transformationStructureStep,
        });

      // THEN
      expect(currentStep).toMatchObject({
        id: 2,
        type: StructureTransformationType.EXTENSION,
        name: "actes-administratifs",
      });
      expect(prevStep).toMatchObject({
        id: 2,
        type: StructureTransformationType.EXTENSION,
        name: "places-et-hebergement",
      });
      expect(nextStep).toBeUndefined();
    });

    it("should compute prevStep from a previous group when crossing structureTransformation boundaries", () => {
      // GIVEN
      const transformationStructureType = StructureTransformationType.EXTENSION;
      const transformationStructureId = 2;
      const transformationStructureStep = "description";

      // WHEN
      const { prevStep, nextStep } = getTransformationFormNavigation({
        transformationSteps,
        transformationStructureType,
        transformationStructureId,
        transformationStructureStep,
      });

      // THEN
      expect(prevStep).toMatchObject({
        id: 1,
        type: StructureTransformationType.FERMETURE,
        name: "description",
      });
      expect(nextStep).toMatchObject({
        id: 2,
        type: StructureTransformationType.EXTENSION,
        name: "places-et-hebergement",
      });
    });

    it("should return undefined currentStep/prevStep/nextStep when step is not found, but keep firstStep", () => {
      // GIVEN
      const transformationStructureType = StructureTransformationType.EXTENSION;
      const transformationStructureId = 999;
      const transformationStructureStep = "description";

      // WHEN
      const { firstStep, currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps,
          transformationStructureType,
          transformationStructureId,
          transformationStructureStep,
        });

      // THEN
      expect(firstStep).toMatchObject({
        id: 1,
        type: StructureTransformationType.FERMETURE,
        name: "description",
      });
      expect(currentStep).toBeUndefined();
      expect(prevStep).toBeUndefined();
      expect(nextStep).toBeUndefined();
    });

    it("should match the step type case-insensitively", () => {
      // GIVEN
      const transformationStructureType =
        "fermeture" as unknown as StructureTransformationType;
      const transformationStructureId = 1;
      const transformationStructureStep = "description";

      // WHEN
      const { currentStep } = getTransformationFormNavigation({
        transformationSteps,
        transformationStructureType,
        transformationStructureId,
        transformationStructureStep,
      });

      // THEN
      expect(currentStep).toMatchObject({
        id: 1,
        type: StructureTransformationType.FERMETURE,
        name: "description",
      });
    });

    it("should return all-undefined navigation when transformationSteps is empty", () => {
      // GIVEN
      const emptySteps: Step[] = [];

      // WHEN
      const { firstStep, currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps: emptySteps,
          transformationStructureType: StructureTransformationType.EXTENSION,
          transformationStructureId: 2,
          transformationStructureStep: "description",
        });

      // THEN
      expect(firstStep).toBeUndefined();
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

    it("should return an empty array when transformation has no structureTransformations", () => {
      // GIVEN
      const transformation: TransformationApiRead = {
        id: 5,
        type: TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
        structureTransformations: [],
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
        structureTransformations: [
          {
            id: 1,
            structureVersion: { structureId: 1001 },
            type: StructureTransformationType.FERMETURE,
          },
          {
            id: 2,
            structureVersion: { structureId: 1003 },
            type: StructureTransformationType.EXTENSION,
          },
          {
            id: 3,
            structureVersion: { structureId: 1002 },
            type: StructureTransformationType.FERMETURE,
          },
          {
            id: 4,
            structureVersion: { structureId: 1003 },
            type: StructureTransformationType.CONTRACTION,
          },
          {
            id: 5,
            structureVersion: { structureId: 1004 },
            type: StructureTransformationType.CREATION,
          },
        ],
      };

      // WHEN
      const result = getTransformationSteps(transformation);

      // THEN
      expect(result.map((step) => step.type)).toEqual([
        StructureTransformationType.FERMETURE,
        StructureTransformationType.FERMETURE,
        StructureTransformationType.CONTRACTION,
        StructureTransformationType.EXTENSION,
        StructureTransformationType.CREATION,
      ]);
    });

    it("should return only the 'description' step for FERMETURE", () => {
      // GIVEN
      const transformation: TransformationApiRead = {
        id: 5,
        structureTransformations: [
          {
            id: 1,
            structureVersion: { structureId: 1001 },
            type: StructureTransformationType.FERMETURE,
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
      StructureTransformationType.EXTENSION,
      StructureTransformationType.CONTRACTION,
      StructureTransformationType.CREATION,
    ])(
      "should return the description / places-et-hebergement / actes-administratifs steps for %s",
      (type) => {
        // GIVEN
        const transformation: TransformationApiRead = {
          id: 5,
          structureTransformations: [
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
  });

  describe("getRoute (tested indirectly via getTransformationSteps)", () => {
    it.each([
      [StructureTransformationType.EXTENSION, "extension"],
      [StructureTransformationType.CONTRACTION, "contraction"],
      [StructureTransformationType.FERMETURE, "fermeture"],
      [StructureTransformationType.CREATION, "creation"],
    ])(
      "should build routes with the URL segment '%s' for %s",
      (type, urlSegment) => {
        // GIVEN
        const transformation: TransformationApiRead = {
          id: 5,
          structureTransformations: [
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
        structureTransformations: [
          {
            id: 13,
            structureVersion: { structureId: 1001 },
            type: StructureTransformationType.EXTENSION,
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

    it("should return empty routes when structureTransformation has no id", () => {
      // GIVEN
      const transformation: TransformationApiRead = {
        id: 5,
        structureTransformations: [
          {
            id: undefined,
            structureVersion: { structureId: 1001 },
            type: StructureTransformationType.EXTENSION,
          },
        ],
      };

      // WHEN
      const result = getTransformationSteps(transformation);

      // THEN
      expect(result[0].steps.map((step) => step.route)).toEqual(["", "", ""]);
    });
  });

  describe("validateStructureTransformationFormStep", () => {
    const buildCreationForm = (): FormApiType => ({
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
          status: StepStatus.NON_COMMENCE,
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
    });

    it("flips only the validated route step to VALIDE, mapping it to its form step slug", () => {
      const form = validateStructureTransformationFormStep(
        buildCreationForm(),
        StructureTransformationStep.ACTES_ADMINISTRATIFS
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
      const form = validateStructureTransformationFormStep(
        buildCreationForm(),
        StructureTransformationStep.DESCRIPTION
      );

      const identificationStep = form.formSteps.find(
        (formStep) => formStep.stepDefinition.slug === "01-identification"
      );
      expect(identificationStep?.status).toBe(StepStatus.VALIDE);
    });

    it("preserves the form and step ids read from the database", () => {
      const form = validateStructureTransformationFormStep(
        buildCreationForm(),
        StructureTransformationStep.DESCRIPTION
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

      const result = validateStructureTransformationFormStep(
        form,
        StructureTransformationStep.ACTES_ADMINISTRATIFS
      );

      expect(
        result.formSteps.every((s) => s.status === StepStatus.NON_COMMENCE)
      ).toBe(true);
    });

    it("returns the form unchanged for an unknown form name", () => {
      const form = buildCreationForm();
      form.formDefinition.name = "unknown-form";

      const result = validateStructureTransformationFormStep(
        form,
        StructureTransformationStep.DESCRIPTION
      );

      expect(
        result.formSteps.every((s) => s.status === StepStatus.NON_COMMENCE)
      ).toBe(true);
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
      const structureTransformation: StructureTransformationApiRead = {
        id: 1,
        type: StructureTransformationType.EXTENSION,
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

      expect(getAdresseSource(structureTransformation)).toEqual({
        nom: "Les Mimosas",
        adresseAdministrative: "58 boulevard Vauban",
        adresseAdministrativeComplete: "58 boulevard Vauban 50300 Avranches",
        codePostalAdministratif: "50300",
        communeAdministrative: "Avranches",
        departementAdministratif: "50",
      });
    });

    it("normalise les champs absents en chaîne vide", () => {
      const structureTransformation: StructureTransformationApiRead = {
        id: 1,
        type: StructureTransformationType.EXTENSION,
      };

      expect(getAdresseSource(structureTransformation)).toEqual({
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
      const structureTransformation: StructureTransformationApiRead = {
        id: 1,
        type: StructureTransformationType.EXTENSION,
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

      expect(getPlacesSource(structureTransformation)).toBe(40);
    });

    it("retombe sur la typologie la plus récente quand aucune ne correspond à l'année de l'effectiveDate", () => {
      const structureTransformation: StructureTransformationApiRead = {
        id: 1,
        type: StructureTransformationType.EXTENSION,
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

      expect(getPlacesSource(structureTransformation)).toBe(47);
    });

    it("retombe sur la typologie la plus récente (max year, pas [0]) quand l'ordre n'est pas décroissant", () => {
      const structureTransformation: StructureTransformationApiRead = {
        id: 1,
        type: StructureTransformationType.EXTENSION,
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

      expect(getPlacesSource(structureTransformation)).toBe(50);
    });

    it("retombe sur la typologie la plus récente quand effectiveDate est absente", () => {
      const structureTransformation: StructureTransformationApiRead = {
        id: 1,
        type: StructureTransformationType.EXTENSION,
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

      expect(getPlacesSource(structureTransformation)).toBe(47);
    });

    it("retourne 0 quand la structure source n'a pas de typologie", () => {
      const structureTransformation: StructureTransformationApiRead = {
        id: 1,
        type: StructureTransformationType.EXTENSION,
      };

      expect(getPlacesSource(structureTransformation)).toBe(0);
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
