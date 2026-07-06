import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreationFlow } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation/CreationFlow";
import { FormKind } from "@/types/global";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import {
  createStructureVersionTransformation,
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
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/PlacesEtHebergementForm",
  () => ({
    PlacesEtHebergementForm: () => <div data-testid="places-form" />,
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/TransformationActesAdministratifsForm",
  () => ({
    TransformationActesAdministratifsForm: () => (
      <div data-testid="actes-form" />
    ),
  })
);

const renderFlow = (transformationType: TransformationType) => {
  const structureVersionTransformation = createStructureVersionTransformation({
    type: StructureVersionTransformationType.CREATION,
  });
  const transformation = createTransformation({
    type: transformationType,
    structureVersionTransformations: [structureVersionTransformation],
  });
  return render(
    <CreationFlow
      transformation={transformation}
      structureVersionTransformation={structureVersionTransformation}
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
      "passe %s en formKind %s au formulaire d'identification",
      (transformationType, expectedFormKind) => {
        mockUseParams.mockReturnValue({
          transformationStructureStep: StructureVersionTransformationStep.DESCRIPTION,
        });

        renderFlow(transformationType);

        expect(screen.getByTestId("identification-form")).toBeInTheDocument();
        expect(captured.formKind).toBe(expectedFormKind);
      }
    );
  });

  describe("step routing", () => {
    it("affiche le formulaire places et hébergement à l'étape PLACES_ET_HEBERGEMENT", () => {
      mockUseParams.mockReturnValue({
        transformationStructureStep:
          StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT,
      });

      renderFlow(TransformationType.OUVERTURE_EX_NIHILO);

      expect(screen.getByTestId("places-form")).toBeInTheDocument();
    });

    it("affiche le formulaire actes administratifs à l'étape ACTES_ADMINISTRATIFS", () => {
      mockUseParams.mockReturnValue({
        transformationStructureStep:
          StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
      });

      renderFlow(TransformationType.OUVERTURE_EX_NIHILO);

      expect(screen.getByTestId("actes-form")).toBeInTheDocument();
    });

    it("n'affiche rien pour une étape inconnue", () => {
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
