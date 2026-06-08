import { render } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ExistingStructureIdentificationForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/ExistingStructureIdentificationForm";
import {
  StructureTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { FormKind } from "@/types/global";
import {
  StructureTransformationType,
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

vi.mock("@/app/components/forms/EffectiveDateInput", () => ({
  EffectiveDateInput: () => null,
}));
vi.mock(
  "@/app/components/forms/adresseAdministrativeAndAntenne/TransformationAdresseAdministrative",
  () => ({
    TransformationAdresseAdministrative: () => null,
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

describe("ExistingStructureIdentificationForm", () => {
  it("passe le structureVersion (et son id) en defaultValues", () => {
    // GIVEN
    const structureTransformation: StructureTransformationApiRead = {
      id: 7,
      type: StructureTransformationType.EXTENSION,
      structureVersion: {
        id: 999,
        structureId: 42,
        nom: "Les Mimosas",
        effectiveDate: "2026-08-25T00:00:00.000Z",
      },
    };
    const transformation: TransformationApiRead = {
      id: 12,
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureTransformations: [structureTransformation],
    };

    // WHEN
    render(
      <ExistingStructureIdentificationForm
        transformation={transformation}
        structureTransformation={structureTransformation}
        formKind={FormKind.EXTENSION}
      />
    );

    // THEN
    expect(captured.defaultValues).toMatchObject({
      id: 999,
      structureId: 42,
      nom: "Les Mimosas",
      effectiveDate: "2026-08-25T00:00:00.000Z",
    });
  });

  it("construit le payload avec effectiveDate et le type de la structureTransformation, sans creationDate", () => {
    // GIVEN
    const structureTransformation: StructureTransformationApiRead = {
      id: 7,
      type: StructureTransformationType.CONTRACTION,
      structureVersion: { id: 999 },
    };
    const transformation: TransformationApiRead = {
      id: 12,
      type: TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES,
      structureTransformations: [structureTransformation],
    };
    render(
      <ExistingStructureIdentificationForm
        transformation={transformation}
        structureTransformation={structureTransformation}
        formKind={FormKind.CONTRACTION}
      />
    );

    // WHEN
    captured.onSubmit?.({
      id: 999,
      nom: "Les Mimosas",
      effectiveDate: "2026-08-25T00:00:00.000Z",
    });

    // THEN
    expect(mockHandleValidation).toHaveBeenCalledWith({
      transformationId: 12,
      structureTransformation: {
        id: 7,
        type: StructureTransformationType.CONTRACTION,
        forms: undefined,
        structureVersion: {
          id: 999,
          nom: "Les Mimosas",
          dnaStructures: undefined,
          effectiveDate: "2026-08-25T00:00:00.000Z",
        },
      },
    });
  });
});
