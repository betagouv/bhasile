import { describe, expect, it } from "vitest";

import {
  getTransformationFormNavigation,
  getTransformationSteps,
  Step,
} from "@/app/utils/transformation.util";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import {
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
          transformationId: 5,
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
          transformationId: 5,
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

    it("should return the verification step as nextStep when on the last form step", () => {
      // GIVEN
      const transformationStructureType = StructureTransformationType.EXTENSION;
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
        type: StructureTransformationType.EXTENSION,
        name: "actes-administratifs",
      });
      expect(prevStep).toMatchObject({
        id: 2,
        type: StructureTransformationType.EXTENSION,
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
        type: StructureTransformationType.EXTENSION,
        name: "actes-administratifs",
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
        transformationId: 5,
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
          transformationId: 5,
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
        transformationId: 5,
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

    it("should return only the verification step as firstStep when transformationSteps is empty", () => {
      // GIVEN
      const emptySteps: Step[] = [];

      // WHEN
      const { firstStep, currentStep, prevStep, nextStep } =
        getTransformationFormNavigation({
          transformationSteps: emptySteps,
          transformationId: 5,
          transformationStructureType: StructureTransformationType.EXTENSION,
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
});
