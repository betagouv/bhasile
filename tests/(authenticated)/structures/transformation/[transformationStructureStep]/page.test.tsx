import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TransformationStructureStepPage from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/page";
import { StructureTransformationApiRead } from "@/schemas/api/transformation.schema";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { createTransformation } from "../../../../test-utils/factories/transformation.factory";

const mockUseTransformationContext = vi.fn();
const mockUseParams = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
  notFound: () => mockNotFound(),
}));

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext",
  () => ({
    useTransformationContext: () => mockUseTransformationContext(),
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/contraction/ContractionFlow",
  () => ({
    ContractionFlow: () => <div data-testid="contraction-flow" />,
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation-depuis-structures/CreationDepuisStructuresFlow",
  () => ({
    CreationDepuisStructuresFlow: () => (
      <div data-testid="creation-depuis-structures-flow" />
    ),
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation-ex-nihilo/CreationExNihiloFlow",
  () => ({
    CreationExNihiloFlow: () => <div data-testid="creation-ex-nihilo-flow" />,
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/extension/ExtensionFlow",
  () => ({
    ExtensionFlow: () => <div data-testid="extension-flow" />,
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/fermeture/FermetureFlow",
  () => ({
    FermetureFlow: () => <div data-testid="fermeture-flow" />,
  })
);

vi.mock("@/app/components/transformations/TransformationStructureHeader", () => ({
  TransformationStructureHeader: () => (
    <div data-testid="transformation-structure-header" />
  ),
}));

describe("TransformationStructureStepPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ transformationStructureId: "7" });
  });

  it("should render FermetureFlow when structureTransformation.type is FERMETURE", () => {
    // GIVEN
    const structureTransformation: StructureTransformationApiRead = {
      id: 7,
      type: StructureTransformationType.FERMETURE,
    };
    mockUseTransformationContext.mockReturnValue({
      transformation: createTransformation({
        type: TransformationType.FERMETURE_SANS_TRANSFERT,
        structureTransformations: [structureTransformation],
      }),
    });

    // WHEN
    render(<TransformationStructureStepPage />);

    // THEN
    expect(screen.getByTestId("fermeture-flow")).toBeInTheDocument();
  });

  it("should render ExtensionFlow when structureTransformation.type is EXTENSION", () => {
    // GIVEN
    const structureTransformation: StructureTransformationApiRead = {
      id: 7,
      type: StructureTransformationType.EXTENSION,
    };
    mockUseTransformationContext.mockReturnValue({
      transformation: createTransformation({
        type: TransformationType.EXTENSION_EX_NIHILO,
        structureTransformations: [structureTransformation],
      }),
    });

    // WHEN
    render(<TransformationStructureStepPage />);

    // THEN
    expect(screen.getByTestId("extension-flow")).toBeInTheDocument();
  });

  it("should render ContractionFlow when structureTransformation.type is CONTRACTION", () => {
    // GIVEN
    const structureTransformation: StructureTransformationApiRead = {
      id: 7,
      type: StructureTransformationType.CONTRACTION,
    };
    mockUseTransformationContext.mockReturnValue({
      transformation: createTransformation({
        type: TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES,
        structureTransformations: [structureTransformation],
      }),
    });

    // WHEN
    render(<TransformationStructureStepPage />);

    // THEN
    expect(screen.getByTestId("contraction-flow")).toBeInTheDocument();
  });

  it("should render CreationExNihiloFlow when structureTransformation.type is CREATION and transformation.type is OUVERTURE_EX_NIHILO", () => {
    // GIVEN
    const structureTransformation: StructureTransformationApiRead = {
      id: 7,
      type: StructureTransformationType.CREATION,
    };
    mockUseTransformationContext.mockReturnValue({
      transformation: createTransformation({
        type: TransformationType.OUVERTURE_EX_NIHILO,
        structureTransformations: [structureTransformation],
      }),
    });

    // WHEN
    render(<TransformationStructureStepPage />);

    // THEN
    expect(screen.getByTestId("creation-ex-nihilo-flow")).toBeInTheDocument();
  });

  it.each([
    TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
    TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR,
  ])(
    "should render CreationDepuisStructuresFlow when CREATION and transformation.type is %s",
    (transformationType) => {
      // GIVEN
      const structureTransformation: StructureTransformationApiRead = {
        id: 7,
        type: StructureTransformationType.CREATION,
      };
      mockUseTransformationContext.mockReturnValue({
        transformation: createTransformation({
          type: transformationType,
          structureTransformations: [structureTransformation],
        }),
      });

      // WHEN
      render(<TransformationStructureStepPage />);

      // THEN
      expect(
        screen.getByTestId("creation-depuis-structures-flow")
      ).toBeInTheDocument();
    }
  );

  it("should render the TransformationStructureHeader above the flow", () => {
    // GIVEN
    const structureTransformation: StructureTransformationApiRead = {
      id: 7,
      type: StructureTransformationType.FERMETURE,
    };
    mockUseTransformationContext.mockReturnValue({
      transformation: createTransformation({
        type: TransformationType.FERMETURE_SANS_TRANSFERT,
        structureTransformations: [structureTransformation],
      }),
    });

    // WHEN
    render(<TransformationStructureStepPage />);

    // THEN
    expect(
      screen.getByTestId("transformation-structure-header")
    ).toBeInTheDocument();
  });

  it("should call notFound when transformation is missing", () => {
    // GIVEN
    mockUseTransformationContext.mockReturnValue({ transformation: null });

    // WHEN / THEN
    expect(() => render(<TransformationStructureStepPage />)).toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("should call notFound when structureTransformation id does not match", () => {
    // GIVEN
    mockUseParams.mockReturnValue({ transformationStructureId: "999" });
    const structureTransformation: StructureTransformationApiRead = {
      id: 7,
      type: StructureTransformationType.FERMETURE,
    };
    mockUseTransformationContext.mockReturnValue({
      transformation: createTransformation({
        type: TransformationType.FERMETURE_SANS_TRANSFERT,
        structureTransformations: [structureTransformation],
      }),
    });

    // WHEN / THEN
    expect(() => render(<TransformationStructureStepPage />)).toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mockNotFound).toHaveBeenCalled();
  });
});
