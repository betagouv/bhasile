import { render } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { CreationIdentificationForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation/CreationIdentificationForm";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { FormKind } from "@/types/global";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockHandleValidation = vi.fn();

vi.mock("@/app/hooks/useTransformationFormHandling", () => ({
  useTransformationFormHandling: () => ({
    handleValidation: mockHandleValidation,
    handleSave: vi.fn(),
  }),
}));

type CapturedProps = {
  defaultValues?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
};
const captured: CapturedProps = {};

vi.mock("@/app/components/forms/FormWrapper", () => ({
  default: ({
    defaultValues,
    onSubmit,
    children,
  }: {
    defaultValues?: Record<string, unknown>;
    onSubmit?: (data: Record<string, unknown>) => void;
    children: ReactNode;
  }) => {
    captured.defaultValues = defaultValues;
    captured.onSubmit = onSubmit;
    return <div data-testid="form-wrapper">{children}</div>;
  },
  FooterButtonType: { CANCEL: "cancel", SAVE: "save", SUBMIT: "submit" },
}));

vi.mock("@/app/components/forms/description/FieldSetDescription", () => ({
  FieldSetDescription: () => null,
}));
vi.mock(
  "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes",
  () => ({
    AdresseAdministrativeAndAntennes: () => null,
  })
);
vi.mock("@/app/components/forms/dnaAndFiness/DnaAndFiness", () => ({
  DnaAndFiness: () => null,
}));
vi.mock("@/app/components/forms/contacts/FieldSetContacts", () => ({
  FieldSetContacts: () => null,
}));
vi.mock("@/app/components/forms/SaveCurrentForm", () => ({
  SaveCurrentForm: () => null,
}));

describe("CreationIdentificationForm", () => {
  it("should pass the structureVersion as defaultValues, including its id", () => {
    // GIVEN
    const structureVersionTransformation: StructureVersionTransformationApiRead = {
      id: 7,
      type: StructureVersionTransformationType.CREATION,
      structureVersion: {
        id: 999,
        structureId: 42,
        nom: "Les Coquelicots",
        creationDate: "2024-01-01T00:00:00.000Z",
      },
    };
    const transformation: TransformationApiRead = {
      id: 12,
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [structureVersionTransformation],
    };

    // WHEN
    render(
      <CreationIdentificationForm
        transformation={transformation}
        structureVersionTransformation={structureVersionTransformation}
        formKind={FormKind.OUVERTURE_EX_NIHILO}
      />
    );

    // THEN
    expect(captured.defaultValues).toMatchObject({
      id: 999,
      structureId: 42,
      nom: "Les Coquelicots",
      creationDate: "2024-01-01T00:00:00.000Z",
    });
  });

  it("should pass transformationId and a structureVersionTransformation update payload to handleValidation", () => {
    // GIVEN
    const structureVersionTransformation: StructureVersionTransformationApiRead = {
      id: 7,
      type: StructureVersionTransformationType.CREATION,
      structureVersion: { id: 999 },
    };
    const transformation: TransformationApiRead = {
      id: 12,
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [structureVersionTransformation],
    };
    render(
      <CreationIdentificationForm
        transformation={transformation}
        structureVersionTransformation={structureVersionTransformation}
        formKind={FormKind.OUVERTURE_EX_NIHILO}
      />
    );

    // WHEN
    captured.onSubmit?.({
      id: 999,
      nom: "Les Coquelicots",
      creationDate: "2024-01-01T00:00:00.000Z",
    });

    // THEN
    expect(mockHandleValidation).toHaveBeenCalledWith({
      transformationId: 12,
      structureVersionTransformation: {
        id: 7,
        type: StructureVersionTransformationType.CREATION,
        forms: undefined,
        operateurId: undefined,
        structureVersion: {
          id: 999,
          nom: "Les Coquelicots",
          dnaStructures: undefined,
          creationDate: "2024-01-01T00:00:00.000Z",
          effectiveDate: "2024-01-01T00:00:00.000Z",
        },
      },
    });
  });
});
