import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExistingStructureFlow } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/ExistingStructureFlow";
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
  "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/ExistingStructureIdentificationForm",
  () => ({
    ExistingStructureIdentificationForm: ({
      formKind,
    }: {
      formKind: FormKind;
    }) => {
      captured.formKind = formKind;
      return <div data-testid="identification-form" />;
    },
  })
);

const renderFlow = (structureType: StructureTransformationType) => {
  const structureTransformation = createStructureTransformation({
    type: structureType,
  });
  const transformation = createTransformation({
    type: TransformationType.EXTENSION_EX_NIHILO,
    structureTransformations: [structureTransformation],
  });
  return render(
    <ExistingStructureFlow
      transformation={transformation}
      structureTransformation={structureTransformation}
    />
  );
};

describe("ExistingStructureFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.formKind = undefined;
  });

  describe("formKind dérivé du type de la structureTransformation", () => {
    it.each([
      [StructureTransformationType.EXTENSION, FormKind.EXTENSION],
      [StructureTransformationType.CONTRACTION, FormKind.CONTRACTION],
    ])(
      "passe le type %s en formKind %s à la Description",
      (structureType, expectedFormKind) => {
        mockUseParams.mockReturnValue({
          transformationStructureStep: StructureTransformationStep.DESCRIPTION,
        });

        renderFlow(structureType);

        expect(screen.getByTestId("identification-form")).toBeInTheDocument();
        expect(captured.formKind).toBe(expectedFormKind);
      }
    );
  });

  describe("routing par étape", () => {
    it("ne rend rien en dehors de l'étape Description", () => {
      mockUseParams.mockReturnValue({
        transformationStructureStep:
          StructureTransformationStep.PLACES_ET_HEBERGEMENT,
      });

      renderFlow(StructureTransformationType.EXTENSION);

      expect(
        screen.queryByTestId("identification-form")
      ).not.toBeInTheDocument();
    });
  });
});
