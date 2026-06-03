import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreationFlow } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation/CreationFlow";
import { FormKind } from "@/types/global";
import {
  StructureTransformationStep,
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import {
  createStructureTransformation,
  createTransformation,
} from "../../../../test-utils/factories/transformation.factory";

const mockUseParams = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
}));

const captured: { formKind?: FormKind } = {};

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation/CreationIdentificationForm",
  () => ({
    CreationIdentificationForm: ({ formKind }: { formKind: FormKind }) => {
      captured.formKind = formKind;
      return <div data-testid="identification-form" />;
    },
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation/CreationPlacesEtHebergementForm",
  () => ({
    CreationPlacesEtHebergementForm: () => <div data-testid="places-form" />,
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation/CreationActesAdministratifsForm",
  () => ({
    CreationActesAdministratifsForm: () => <div data-testid="actes-form" />,
  })
);

const renderFlow = (transformationType: TransformationType) => {
  const structureTransformation = createStructureTransformation({
    type: StructureTransformationType.CREATION,
  });
  const transformation = createTransformation({
    type: transformationType,
    structureTransformations: [structureTransformation],
  });
  return render(
    <CreationFlow
      transformation={transformation}
      structureTransformation={structureTransformation}
    />
  );
};

describe("CreationFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.formKind = undefined;
  });

  describe("formKind derived from the transformation type", () => {
    it.each([
      [TransformationType.OUVERTURE_EX_NIHILO, FormKind.OUVERTURE_EX_NIHILO],
      [
        TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
        FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      ],
      [
        TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR,
        FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES,
      ],
    ])(
      "passes %s as formKind %s to the identification form",
      (transformationType, expectedFormKind) => {
        mockUseParams.mockReturnValue({
          transformationStructureStep: StructureTransformationStep.DESCRIPTION,
        });

        renderFlow(transformationType);

        expect(screen.getByTestId("identification-form")).toBeInTheDocument();
        expect(captured.formKind).toBe(expectedFormKind);
      }
    );
  });

  describe("step routing", () => {
    it("renders the places et hebergement form on the PLACES_ET_HEBERGEMENT step", () => {
      mockUseParams.mockReturnValue({
        transformationStructureStep:
          StructureTransformationStep.PLACES_ET_HEBERGEMENT,
      });

      renderFlow(TransformationType.OUVERTURE_EX_NIHILO);

      expect(screen.getByTestId("places-form")).toBeInTheDocument();
    });

    it("renders the actes administratifs form on the ACTES_ADMINISTRATIFS step", () => {
      mockUseParams.mockReturnValue({
        transformationStructureStep:
          StructureTransformationStep.ACTES_ADMINISTRATIFS,
      });

      renderFlow(TransformationType.OUVERTURE_EX_NIHILO);

      expect(screen.getByTestId("actes-form")).toBeInTheDocument();
    });

    it("renders nothing for an unknown step", () => {
      mockUseParams.mockReturnValue({
        transformationStructureStep: "unknown-step",
      });

      renderFlow(TransformationType.OUVERTURE_EX_NIHILO);

      expect(
        screen.queryByTestId("identification-form")
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("places-form")).not.toBeInTheDocument();
      expect(screen.queryByTestId("actes-form")).not.toBeInTheDocument();
    });
  });
});
