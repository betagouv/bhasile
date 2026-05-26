import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import {
  StructureTransformationApiRead,
  StructureTransformationApiUpdate,
} from "@/schemas/api/transformation.schema";
import {
  StructureTransformationStep,
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { createTransformation } from "../test-utils/factories/transformation.factory";

const mockUseParams = vi.fn();
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();
const mockUseTransformationContext = vi.fn();
const mockUpdateTransformation = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
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

const buildTransformation = () =>
  createTransformation({
    id: 12,
    type: TransformationType.OUVERTURE_EX_NIHILO,
    structureTransformations: [
      {
        id: 7,
        type: StructureTransformationType.CREATION,
      } as StructureTransformationApiRead,
    ],
  });

const buildPayload = (): {
  transformationId: number;
  structureTransformation: StructureTransformationApiUpdate;
} => ({
  transformationId: 12,
  structureTransformation: {
    id: 7,
    type: StructureTransformationType.CREATION,
    structureVersion: { nom: "Les Coquelicots" },
  },
});

describe("useTransformationFormHandling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation(),
      setTransformation,
    });
    mockUseParams.mockReturnValue({
      transformationStructureType: StructureTransformationType.CREATION,
      transformationStructureId: "7",
      transformationStructureStep: StructureTransformationStep.DESCRIPTION,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should build the TransformationApiUpdate payload and forward setTransformation", async () => {
    // GIVEN
    mockUpdateTransformation.mockResolvedValue(12);

    // WHEN
    const { result } = renderHook(() => useTransformationFormHandling());
    await result.current.handleValidation(buildPayload());

    // THEN
    expect(mockUpdateTransformation).toHaveBeenCalledWith(
      12,
      {
        id: 12,
        structureTransformations: [
          {
            id: 7,
            type: StructureTransformationType.CREATION,
            structureVersion: { nom: "Les Coquelicots" },
          },
        ],
      },
      setTransformation
    );
  });

  it("should push to nextStep.route on success", async () => {
    // GIVEN
    mockUpdateTransformation.mockResolvedValue(12);

    // WHEN
    const { result } = renderHook(() => useTransformationFormHandling());
    await result.current.handleValidation(buildPayload());

    // THEN — currentStep is "description" → nextStep is "places-et-hebergement"
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/structures/transformation/12/creation/7/places-et-hebergement"
    );
  });

  it("should NOT navigate when there is no next step", async () => {
    // GIVEN — currentStep is the last one (actes-administratifs)
    mockUseParams.mockReturnValue({
      transformationStructureType: StructureTransformationType.CREATION,
      transformationStructureId: "7",
      transformationStructureStep:
        StructureTransformationStep.ACTES_ADMINISTRATIFS,
    });
    mockUpdateTransformation.mockResolvedValue(12);

    // WHEN
    const { result } = renderHook(() => useTransformationFormHandling());
    await result.current.handleValidation(buildPayload());

    // THEN
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("should log the error and not navigate when updateTransformation rejects", async () => {
    // GIVEN
    const error = new Error("boom");
    mockUpdateTransformation.mockRejectedValue(error);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // WHEN
    const { result } = renderHook(() => useTransformationFormHandling());
    await expect(
      result.current.handleValidation(buildPayload())
    ).resolves.toBeUndefined();

    // THEN
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(mockRouterPush).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should redirect to the firstStep when currentStep is not found", () => {
    // GIVEN — invalid step in URL
    mockUseParams.mockReturnValue({
      transformationStructureType: StructureTransformationType.CREATION,
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
      transformationStructureType: StructureTransformationType.CREATION,
      transformationStructureId: "7",
      transformationStructureStep:
        StructureTransformationStep.PLACES_ET_HEBERGEMENT,
    });

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
});
