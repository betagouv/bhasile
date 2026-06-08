import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TransformationStructureStepPage from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/page";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import {
  StructureVersionTransformationType,
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

vi.mock("@/app/context/FetchStateContext", () => ({
  useFetchState: () => ({
    getFetchState: () => "idle",
    setFetchState: vi.fn(),
  }),
}));

vi.mock("@/app/components/SubmitError", () => ({
  SubmitError: () => <div data-testid="submit-error" />,
}));

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation/CreationFlow",
  () => ({
    CreationFlow: () => <div data-testid="creation-flow" />,
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/ExistingStructureFlow",
  () => ({
    ExistingStructureFlow: () => <div data-testid="existing-structure-flow" />,
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

  it("should render FermetureFlow when structureVersionTransformation.type is FERMETURE", () => {
    // GIVEN
    const structureVersionTransformation: StructureVersionTransformationApiRead = {
      id: 7,
      type: StructureVersionTransformationType.FERMETURE,
    };
    mockUseTransformationContext.mockReturnValue({
      transformation: createTransformation({
        type: TransformationType.FERMETURE_SANS_TRANSFERT,
        structureVersionTransformations: [structureVersionTransformation],
      }),
    });

    // WHEN
    render(<TransformationStructureStepPage />);

    // THEN
    expect(screen.getByTestId("fermeture-flow")).toBeInTheDocument();
  });

  it.each([
    [
      StructureVersionTransformationType.EXTENSION,
      TransformationType.EXTENSION_EX_NIHILO,
    ],
    [
      StructureVersionTransformationType.CONTRACTION,
      TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES,
    ],
  ])(
    "should render ExistingStructureFlow when structureVersionTransformation.type is %s",
    (structureVersionTransformationType, transformationType) => {
      // GIVEN
      const structureVersionTransformation: StructureVersionTransformationApiRead = {
        id: 7,
        type: structureVersionTransformationType,
      };
      mockUseTransformationContext.mockReturnValue({
        transformation: createTransformation({
          type: transformationType,
          structureVersionTransformations: [structureVersionTransformation],
        }),
      });

      // WHEN
      render(<TransformationStructureStepPage />);

      // THEN
      expect(
        screen.getByTestId("existing-structure-flow")
      ).toBeInTheDocument();
    }
  );

  it.each([
    TransformationType.OUVERTURE_EX_NIHILO,
    TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
    TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR,
  ])(
    "should render CreationFlow when CREATION and transformation.type is %s",
    (transformationType) => {
      // GIVEN
      const structureVersionTransformation: StructureVersionTransformationApiRead = {
        id: 7,
        type: StructureVersionTransformationType.CREATION,
      };
      mockUseTransformationContext.mockReturnValue({
        transformation: createTransformation({
          type: transformationType,
          structureVersionTransformations: [structureVersionTransformation],
        }),
      });

      // WHEN
      render(<TransformationStructureStepPage />);

      // THEN
      expect(screen.getByTestId("creation-flow")).toBeInTheDocument();
    }
  );

  it("should render the TransformationStructureHeader above the flow", () => {
    // GIVEN
    const structureVersionTransformation: StructureVersionTransformationApiRead = {
      id: 7,
      type: StructureVersionTransformationType.FERMETURE,
    };
    mockUseTransformationContext.mockReturnValue({
      transformation: createTransformation({
        type: TransformationType.FERMETURE_SANS_TRANSFERT,
        structureVersionTransformations: [structureVersionTransformation],
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

  it("should call notFound when structureVersionTransformation id does not match", () => {
    // GIVEN
    mockUseParams.mockReturnValue({ transformationStructureId: "999" });
    const structureVersionTransformation: StructureVersionTransformationApiRead = {
      id: 7,
      type: StructureVersionTransformationType.FERMETURE,
    };
    mockUseTransformationContext.mockReturnValue({
      transformation: createTransformation({
        type: TransformationType.FERMETURE_SANS_TRANSFERT,
        structureVersionTransformations: [structureVersionTransformation],
      }),
    });

    // WHEN / THEN
    expect(() => render(<TransformationStructureStepPage />)).toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(mockNotFound).toHaveBeenCalled();
  });
});
