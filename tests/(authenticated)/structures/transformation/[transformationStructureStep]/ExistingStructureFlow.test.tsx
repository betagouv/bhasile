import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExistingStructureFlow } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/ExistingStructureFlow";
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

const captured: {
  identificationFormKind?: FormKind;
  placesFormKind?: FormKind;
  originalPlaces?: number;
} = {};

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/ExistingStructureIdentificationForm",
  () => ({
    ExistingStructureIdentificationForm: ({
      formKind,
    }: {
      formKind: FormKind;
    }) => {
      captured.identificationFormKind = formKind;
      return <div data-testid="identification-form" />;
    },
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/PlacesEtHebergementForm",
  () => ({
    PlacesEtHebergementForm: ({
      formKind,
      originalPlaces,
    }: {
      formKind: FormKind;
      originalPlaces?: number;
    }) => {
      captured.placesFormKind = formKind;
      captured.originalPlaces = originalPlaces;
      return <div data-testid="places-form" />;
    },
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

const renderFlow = (structureType: StructureVersionTransformationType) => {
  const structureVersionTransformation = createStructureVersionTransformation({
    type: structureType,
  });
  const transformation = createTransformation({
    type: TransformationType.EXTENSION_EX_NIHILO,
    structureVersionTransformations: [structureVersionTransformation],
  });
  return render(
    <ExistingStructureFlow
      transformation={transformation}
      structureVersionTransformation={structureVersionTransformation}
    />
  );
};

describe("ExistingStructureFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.identificationFormKind = undefined;
    captured.placesFormKind = undefined;
    captured.originalPlaces = undefined;
  });

  describe("formKind dérivé du type de la structureVersionTransformation", () => {
    it.each([
      [StructureVersionTransformationType.EXTENSION, FormKind.EXTENSION],
      [StructureVersionTransformationType.CONTRACTION, FormKind.CONTRACTION],
    ])(
      "passe le type %s en formKind %s à la Description",
      (structureType, expectedFormKind) => {
        mockUseParams.mockReturnValue({
          transformationStructureStep:
            StructureVersionTransformationStep.DESCRIPTION,
        });

        renderFlow(structureType);

        expect(screen.getByTestId("identification-form")).toBeInTheDocument();
        expect(captured.identificationFormKind).toBe(expectedFormKind);
      }
    );
  });

  describe("routing par étape", () => {
    it("rend le form Places et hébergement avec formKind + originalPlaces", () => {
      mockUseParams.mockReturnValue({
        transformationStructureStep:
          StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT,
      });

      renderFlow(StructureVersionTransformationType.CONTRACTION);

      expect(screen.getByTestId("places-form")).toBeInTheDocument();
      expect(
        screen.queryByTestId("identification-form")
      ).not.toBeInTheDocument();
      expect(captured.placesFormKind).toBe(FormKind.CONTRACTION);
      expect(captured.originalPlaces).toBeUndefined();
    });

    it("rend le form actes administratifs sur l'étape ACTES_ADMINISTRATIFS", () => {
      mockUseParams.mockReturnValue({
        transformationStructureStep:
          StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
      });

      renderFlow(StructureVersionTransformationType.EXTENSION);

      expect(screen.getByTestId("actes-form")).toBeInTheDocument();
    });

    it("ne rend rien pour une étape inconnue", () => {
      mockUseParams.mockReturnValue({
        transformationStructureStep: "unknown-step",
      });

      renderFlow(StructureVersionTransformationType.EXTENSION);

      expect(
        screen.queryByTestId("identification-form")
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("places-form")).not.toBeInTheDocument();
      expect(screen.queryByTestId("actes-form")).not.toBeInTheDocument();
    });
  });
});
