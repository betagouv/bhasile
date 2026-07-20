import { describe, expect, it } from "vitest";

import {
  buildTransformationTypologie,
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
  createTransformationForm,
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

    it("retourne un prevStep et un nextStep définis quand l'étape est au milieu de son groupe", () => {
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

    it("retourne un prevStep undefined quand l'étape est la toute première", () => {
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

    it("retourne l'étape de vérification comme nextStep quand on est sur la dernière étape du formulaire", () => {
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

    it("résout l'étape de vérification et expose la dernière étape du formulaire comme prevStep", () => {
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

    it("calcule prevStep depuis un groupe précédent en franchissant les frontières de structureVersionTransformation", () => {
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

    it("retourne currentStep/prevStep/nextStep undefined quand l'étape est introuvable, mais conserve firstStep", () => {
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

    it("fait correspondre le type d'étape sans tenir compte de la casse", () => {
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

    it("retourne uniquement l'étape de vérification comme firstStep quand transformationSteps est vide", () => {
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

    it("devrait exposer un backLink vers la page de sélection quand l'étape est la toute première", () => {
      // GIVEN
      const transformationStructureType =
        StructureVersionTransformationType.FERMETURE;
      const transformationStructureId = 1;
      const transformationStructureStep = "description";

      // WHEN
      const { backLink } = getTransformationFormNavigation({
        transformationSteps,
        transformationId: 5,
        transformationStructureType,
        transformationStructureId,
        transformationStructureStep,
      });

      // THEN
      expect(backLink).toEqual({
        href: "/structures/transformation/5/selection",
        label: "Modifier le cas de figure",
      });
    });

    it("devrait exposer un backLink vers l'étape précédente au sein du même groupe", () => {
      // GIVEN
      const transformationStructureType =
        StructureVersionTransformationType.EXTENSION;
      const transformationStructureId = 2;
      const transformationStructureStep = "places-et-hebergement";

      // WHEN
      const { backLink } = getTransformationFormNavigation({
        transformationSteps,
        transformationId: 5,
        transformationStructureType,
        transformationStructureId,
        transformationStructureStep,
      });

      // THEN
      expect(backLink).toEqual({
        href: "/structures/transformation/5/extension/2/description",
        label: "Étape précédente",
      });
    });

    it("devrait exposer un backLink vers le groupe précédent en franchissant les frontières de structureVersionTransformation", () => {
      // GIVEN
      const transformationStructureType =
        StructureVersionTransformationType.EXTENSION;
      const transformationStructureId = 2;
      const transformationStructureStep = "description";

      // WHEN
      const { backLink } = getTransformationFormNavigation({
        transformationSteps,
        transformationId: 5,
        transformationStructureType,
        transformationStructureId,
        transformationStructureStep,
      });

      // THEN
      expect(backLink).toEqual({
        href: "/structures/transformation/5/fermeture/1/description",
        label: "Étape précédente",
      });
    });
  });

  describe("getTransformationSteps", () => {
    it("retourne un tableau vide quand la transformation est undefined", () => {
      // WHEN
      const result = getTransformationSteps(undefined);

      // THEN
      expect(result).toEqual([]);
    });

    it("retourne un tableau vide quand la transformation n'a pas de structureVersionTransformations", () => {
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

    it("trie les transformations de structure FERMETURE → CONTRACTION → EXTENSION → CREATION", () => {
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

    it("retourne uniquement l'étape 'description' pour une FERMETURE", () => {
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
      "retourne les étapes description / places-et-hebergement / actes-administratifs pour %s",
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

    it("reporte le statut de chaque étape lu depuis le formulaire de la structureVersionTransformation", () => {
      // GIVEN — an extension whose form has only the description step validated
      const transformation: TransformationApiRead = {
        id: 5,
        structureVersionTransformations: [
          {
            id: 1,
            type: StructureVersionTransformationType.EXTENSION,
            structureVersion: { structureId: 1001 },
            form: createTransformationForm({
              validatedSlugs: ["01-identification"],
            }),
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

    it("met chaque statut d'étape à NON_COMMENCE par défaut quand le formulaire est absent", () => {
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
      "construit les routes avec le segment d'URL '%s' pour %s",
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

    it("construit le motif de route complet transformationId / type / idStep / nom d'étape", () => {
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

    it("retourne des routes vides quand la structureVersionTransformation n'a pas d'id", () => {
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
      "renvoie la page de la structure impactée pour %s",
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

    it("choisit la structure du type principal quand plusieurs structureVersionTransformations existent", () => {
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
    ])("renvoie /structures pour %s (pas de type principal)", (transformationType) => {
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

    it("se rabat sur /structures quand la structureVersionTransformation principale n'a pas de structureId", () => {
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
    const buildCreationForm = (validatedSlugs: string[] = []): FormApiType =>
      createTransformationForm({
        name: "structure-transformation-creation",
        validatedSlugs,
      });

    it("ne passe que l'étape de route ciblée au statut donné, en la mappant sur le slug de son étape de formulaire", () => {
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

    it("mappe l'étape de route description sur l'étape de formulaire 01-identification", () => {
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

    it("rétrograde une étape déjà validée quand le statut donné est COMMENCE", () => {
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

    it("préserve les ids de formulaire et d'étape lus depuis la base de données", () => {
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

    it("retourne le formulaire inchangé quand l'étape n'appartient pas au formulaire", () => {
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

    it("retourne le formulaire inchangé pour un nom de formulaire inconnu", () => {
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

    it("passe le statut du formulaire à true une fois la dernière étape restante validée", () => {
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

    it("garde le statut du formulaire à false tant qu'au moins une étape n'est pas validée", () => {
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
    ])("retourne %s → %s", (formKind, expected) => {
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
    ])("retourne %s → %s", (formKind, expected) => {
      expect(isTransformationSurStructureExistante(formKind)).toBe(expected);
    });
  });

  describe("getPlacesSource", () => {
    // Places de la structure source à la date d'effet : le serveur résout la version
    // de référence et pose son scalaire sur la structure. getPlacesSource ne fait que le lire.
    it("retourne le scalaire placesAutorisees de la structure source", () => {
      const structureVersionTransformation: StructureVersionTransformationApiRead =
        {
          id: 1,
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: {
            effectiveDate: "2025-08-25T12:00:00.000Z",
            structure: {
              codeBhasile: "BHA-NOR-001",
              placesAutorisees: 40,
            },
          },
        };

      expect(getPlacesSource(structureVersionTransformation)).toBe(40);
    });

    it("retourne undefined quand la structure source n'a pas de places", () => {
      const structureVersionTransformation: StructureVersionTransformationApiRead =
        {
          id: 1,
          type: StructureVersionTransformationType.EXTENSION,
        };

      expect(getPlacesSource(structureVersionTransformation)).toBeUndefined();
    });
  });

  describe("buildTransformationTypologie", () => {
    // Split précoce : places = scalaire de la version (brouillon), détail (pmr/lgbt/
    // fvvTeh) = ce que la transfo a déclaré sur la SVT, résolu par année.
    const makeSvt = (
      structureVersion: {
        effectiveDate?: string;
        placesAutorisees?: number | null;
      },
      structureTypologies: {
        year: number;
        pmr?: number;
        lgbt?: number;
        fvvTeh?: number;
      }[]
    ) =>
      ({
        structureVersion,
        structureTypologies,
      }) as StructureVersionTransformationApiRead;

    it("date à l'année de l'effectiveDate, places depuis le scalaire, détail depuis la SVT de cette année", () => {
      const svt = makeSvt(
        { effectiveDate: "2025-08-25T12:00:00.000Z", placesAutorisees: 47 },
        [
          { year: 2026, pmr: 3, lgbt: 2, fvvTeh: 1 },
          { year: 2025, pmr: 2, lgbt: 1, fvvTeh: 0 },
          { year: 2024, pmr: 1, lgbt: 0, fvvTeh: 0 },
        ]
      );

      expect(buildTransformationTypologie(svt)).toEqual({
        year: 2025,
        placesAutorisees: 47,
        pmr: 2,
        lgbt: 1,
        fvvTeh: 0,
      });
    });

    it("retombe sur le détail le plus récent quand aucune SVT ne correspond à l'année", () => {
      const svt = makeSvt(
        { effectiveDate: "2026-08-25T12:00:00.000Z", placesAutorisees: 47 },
        [
          { year: 2025, pmr: 2, lgbt: 1, fvvTeh: 0 },
          { year: 2024, pmr: 1, lgbt: 0, fvvTeh: 0 },
        ]
      );

      expect(buildTransformationTypologie(svt)).toEqual({
        year: 2026,
        placesAutorisees: 47,
        pmr: 2,
        lgbt: 1,
        fvvTeh: 0,
      });
    });

    it("utilise l'année en cours sans effectiveDate, détail depuis la SVT la plus récente", () => {
      const svt = makeSvt({ placesAutorisees: 47 }, [
        { year: 2025, pmr: 2, lgbt: 1, fvvTeh: 0 },
        { year: 2024, pmr: 1, lgbt: 0, fvvTeh: 0 },
      ]);

      expect(buildTransformationTypologie(svt)).toEqual({
        year: new Date().getFullYear(),
        placesAutorisees: 47,
        pmr: 2,
        lgbt: 1,
        fvvTeh: 0,
      });
    });

    it("prend le détail de l'année max (pas structureTypologies[0]) quand l'ordre n'est pas décroissant", () => {
      const svt = makeSvt(
        { effectiveDate: "2030-01-01T12:00:00.000Z", placesAutorisees: 50 },
        [
          { year: 2024, pmr: 1, lgbt: 0, fvvTeh: 0 },
          { year: 2026, pmr: 3, lgbt: 2, fvvTeh: 1 },
          { year: 2025, pmr: 2, lgbt: 1, fvvTeh: 0 },
        ]
      );

      expect(buildTransformationTypologie(svt)).toEqual({
        year: 2030,
        placesAutorisees: 50,
        pmr: 3,
        lgbt: 2,
        fvvTeh: 1,
      });
    });

    it("retombe sur l'année en cours sans SVT (undefined)", () => {
      expect(buildTransformationTypologie(undefined)).toEqual({
        year: new Date().getFullYear(),
        placesAutorisees: undefined,
        pmr: undefined,
        lgbt: undefined,
        fvvTeh: undefined,
      });
    });

    it("retombe sur l'année en cours pour une création ex-nihilo (SVT sans détail ni places)", () => {
      const svt = makeSvt({}, []);

      expect(buildTransformationTypologie(svt)).toEqual({
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
        // Split précoce : places sur le scalaire de la version...
        placesAutorisees: 47,
      } as StructureVersionApiRead,
      // ...détail déclaré sur la SVT.
      structureTypologies: [{ year: 2025, pmr: 2, lgbt: 1, fvvTeh: 0 }],
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
    ])("retourne %s → '%s'", (formKind, expected) => {
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
