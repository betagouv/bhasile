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
    captured.formKind = undefined;
  });

  describe("formKind dérivé du type de la structureVersionTransformation", () => {
    it.each([
      [StructureVersionTransformationType.EXTENSION, FormKind.EXTENSION],
      [StructureVersionTransformationType.CONTRACTION, FormKind.CONTRACTION],
    ])(
      "passe le type %s en formKind %s à la Description",
      (structureType, expectedFormKind) => {
        mockUseParams.mockReturnValue({
          transformationStructureStep: StructureVersionTransformationStep.DESCRIPTION,
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
          StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT,
      });

      renderFlow(StructureVersionTransformationType.EXTENSION);

      expect(
        screen.queryByTestId("identification-form")
      ).not.toBeInTheDocument();
    });
  });
});
