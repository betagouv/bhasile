import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import {
  StructureVersionTransformationApiRead,
  StructureVersionTransformationApiUpdateClient,
} from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { createTransformation } from "../test-utils/factories/transformation.factory";

const mockUseParams = vi.fn();
const mockUsePathname = vi.fn();
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();
const mockUseTransformationContext = vi.fn();
const mockUpdateTransformation = vi.fn();
const mockSaveCurrentForm = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
}));

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext",
  () => ({
    useTransformationContext: () => mockUseTransformationContext(),
  })
);

vi.mock("@/app/hooks/useTransformations", () => ({
  useTransformations: () => ({
    updateTransformation: mockUpdateTransformation,
  }),
}));

const setTransformation = vi.fn();

// The strict schema passes for { nom: "Les Coquelicots" } and fails otherwise
const strictSchema = z.object({ nom: z.string().min(1) });

const buildCreationForm = (validatedSlugs: string[] = []) => ({
  id: 100,
  status: [
    "01-identification",
    "02-places-hebergement",
    "03-actes-administratifs",
  ].every((slug) => validatedSlugs.includes(slug)),
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

const buildTransformation = (form = buildCreationForm()) =>
  createTransformation({
    id: 12,
    type: TransformationType.OUVERTURE_EX_NIHILO,
    structureVersionTransformations: [
      {
        id: 7,
        type: StructureVersionTransformationType.CREATION,
        form,
      } as StructureVersionTransformationApiRead,
    ],
  });

const buildSavePayload = (
  values: unknown = { nom: "Les Coquelicots" }
): {
  transformationId: number;
  structureVersionTransformation: StructureVersionTransformationApiUpdateClient;
  strictSchema: z.ZodTypeAny;
  values: unknown;
} => ({
  transformationId: 12,
  structureVersionTransformation: {
    id: 7,
    type: StructureVersionTransformationType.CREATION,
    structureVersion: { nom: "Les Coquelicots" },
  },
  strictSchema,
  values,
});

describe("useTransformationFormHandling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation(),
      setTransformation,
      saveCurrentForm: mockSaveCurrentForm,
      shouldShowIncompleteSteps: false,
    });
    mockUseParams.mockReturnValue({
      transformationStructureType: StructureVersionTransformationType.CREATION,
      transformationStructureId: "7",
      transformationStructureStep:
        StructureVersionTransformationStep.DESCRIPTION,
    });
    mockUsePathname.mockReturnValue(
      "/structures/transformation/12/creation/7/description"
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("handleSave", () => {
    it("reuses the read form and marks the current step VALIDE when the strict schema passes", async () => {
      // GIVEN — currentStep is "description" and the values satisfy the strict schema
      mockUpdateTransformation.mockResolvedValue(12);

      // WHEN
      const { result } = renderHook(() => useTransformationFormHandling());
      await result.current.handleSave(buildSavePayload());

      // THEN — the "description" step (01-identification) is flipped to VALIDE
      expect(mockUpdateTransformation).toHaveBeenCalledWith(
        12,
        {
          id: 12,
          structureVersionTransformations: [
            {
              id: 7,
              type: StructureVersionTransformationType.CREATION,
              structureVersion: { nom: "Les Coquelicots" },
              form: buildCreationForm(["01-identification"]),
            },
          ],
        },
        setTransformation
      );
    });

    it("marks the current step COMMENCE when the strict schema fails", async () => {
      // GIVEN — values that do not satisfy the strict schema
      mockUpdateTransformation.mockResolvedValue(12);

      // WHEN
      const { result } = renderHook(() => useTransformationFormHandling());
      await result.current.handleSave(buildSavePayload({ nom: "" }));

      // THEN — the "description" step (01-identification) is set to COMMENCE
      const savedForm =
        mockUpdateTransformation.mock.calls[0][1]
          .structureVersionTransformations[0].form;
      const identificationStep = savedForm.formSteps.find(
        (formStep: { stepDefinition: { slug: string } }) =>
          formStep.stepDefinition.slug === "01-identification"
      );
      expect(identificationStep.status).toBe(StepStatus.COMMENCE);
      expect(savedForm.status).toBe(false);
    });

    it("derives the child form status to true once the last step is validated", async () => {
      // GIVEN — the two first steps of the child form are already VALIDE
      mockUseTransformationContext.mockReturnValue({
        transformation: buildTransformation(
          buildCreationForm(["01-identification", "02-places-hebergement"])
        ),
        setTransformation,
        saveCurrentForm: mockSaveCurrentForm,
        shouldShowIncompleteSteps: false,
      });
      // AND — the current step is the last one (actes-administratifs)
      mockUseParams.mockReturnValue({
        transformationStructureType: StructureVersionTransformationType.CREATION,
        transformationStructureId: "7",
        transformationStructureStep:
          StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
      });
      mockUsePathname.mockReturnValue(
        "/structures/transformation/12/creation/7/actes-administratifs"
      );
      mockUpdateTransformation.mockResolvedValue(12);

      // WHEN
      const { result } = renderHook(() => useTransformationFormHandling());
      await result.current.handleSave(buildSavePayload());

      // THEN — every step is VALIDE so the child form status is derived to true
      expect(mockUpdateTransformation).toHaveBeenCalledWith(
        12,
        {
          id: 12,
          structureVersionTransformations: [
            {
              id: 7,
              type: StructureVersionTransformationType.CREATION,
              structureVersion: { nom: "Les Coquelicots" },
              form: buildCreationForm([
                "01-identification",
                "02-places-hebergement",
                "03-actes-administratifs",
              ]),
            },
          ],
        },
        setTransformation
      );
    });
  });

  describe("goToNextStep", () => {
    it("saves the current form and pushes to nextStep.route on success", async () => {
      // GIVEN — the shared saver succeeds
      mockSaveCurrentForm.mockResolvedValue(true);

      // WHEN
      const { result } = renderHook(() => useTransformationFormHandling());
      await result.current.goToNextStep();

      // THEN — currentStep is "description" → nextStep is "places-et-hebergement"
      expect(mockSaveCurrentForm).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/structures/transformation/12/creation/7/places-et-hebergement"
      );
    });

    it("pushes to /verification after submitting the last form step", async () => {
      // GIVEN — currentStep is the last form step (actes-administratifs)
      mockUseParams.mockReturnValue({
        transformationStructureType: StructureVersionTransformationType.CREATION,
        transformationStructureId: "7",
        transformationStructureStep:
          StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
      });
      mockUsePathname.mockReturnValue(
        "/structures/transformation/12/creation/7/actes-administratifs"
      );
      mockSaveCurrentForm.mockResolvedValue(true);

      // WHEN
      const { result } = renderHook(() => useTransformationFormHandling());
      await result.current.goToNextStep();

      // THEN
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/structures/transformation/12/verification"
      );
    });

    it("does not navigate when the shared saver fails (invalid draft / save error)", async () => {
      // GIVEN — the saver could not persist
      mockSaveCurrentForm.mockResolvedValue(false);

      // WHEN
      const { result } = renderHook(() => useTransformationFormHandling());
      await result.current.goToNextStep();

      // THEN
      expect(mockSaveCurrentForm).toHaveBeenCalledTimes(1);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it("logs the error and does not navigate when the saver rejects", async () => {
      // GIVEN
      const error = new Error("boom");
      mockSaveCurrentForm.mockRejectedValue(error);
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // WHEN
      const { result } = renderHook(() => useTransformationFormHandling());
      await expect(result.current.goToNextStep()).resolves.toBeUndefined();

      // THEN
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      expect(mockRouterPush).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("is a no-op (no save, no navigation) when currentStep is not resolved", async () => {
      // GIVEN — invalid step in URL → currentStep is undefined
      mockUseParams.mockReturnValue({
        transformationStructureType: StructureVersionTransformationType.CREATION,
        transformationStructureId: "7",
        transformationStructureStep: "unknown-step",
      });

      // WHEN
      const { result } = renderHook(() => useTransformationFormHandling());

      // THEN — does not save and does not navigate
      await expect(result.current.goToNextStep()).resolves.toBeUndefined();
      expect(mockSaveCurrentForm).not.toHaveBeenCalled();
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  it("should redirect to the firstStep when currentStep is not found", () => {
    // GIVEN — invalid step in URL
    mockUseParams.mockReturnValue({
      transformationStructureType: StructureVersionTransformationType.CREATION,
      transformationStructureId: "7",
      transformationStructureStep: "unknown-step",
    });

    // WHEN
    renderHook(() => useTransformationFormHandling());

    // THEN
    expect(mockRouterReplace).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith(
      "/structures/transformation/12/creation/7/description"
    );
  });

  it("should expose nextStep and prevStep based on the current position", () => {
    // GIVEN — currentStep is "places-et-hebergement" (middle of 3 steps)
    mockUseParams.mockReturnValue({
      transformationStructureType: StructureVersionTransformationType.CREATION,
      transformationStructureId: "7",
      transformationStructureStep:
        StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT,
    });
    mockUsePathname.mockReturnValue(
      "/structures/transformation/12/creation/7/places-et-hebergement"
    );

    // WHEN
    const { result } = renderHook(() => useTransformationFormHandling());

    // THEN
    expect(result.current.prevStep?.route).toBe(
      "/structures/transformation/12/creation/7/description"
    );
    expect(result.current.nextStep?.route).toBe(
      "/structures/transformation/12/creation/7/actes-administratifs"
    );
  });

  it("should resolve the verification step when on the /verification page", () => {
    // GIVEN — URL params have no structure-step segments
    mockUseParams.mockReturnValue({});
    mockUsePathname.mockReturnValue(
      "/structures/transformation/12/verification"
    );

    // WHEN
    const { result } = renderHook(() => useTransformationFormHandling());

    // THEN — prevStep is the last form step, no nextStep
    expect(result.current.prevStep?.route).toBe(
      "/structures/transformation/12/creation/7/actes-administratifs"
    );
    expect(result.current.nextStep).toBeUndefined();
  });
});
