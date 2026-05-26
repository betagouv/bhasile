import { render } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { CreationExNihiloIdentificationForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation-ex-nihilo/CreationExNihiloIdentificationForm";
import { StructureTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureTransformationType } from "@/types/transformation.type";

const mockHandleValidation = vi.fn();

vi.mock("@/app/hooks/useTransformationFormHandling", () => ({
  useTransformationFormHandling: () => ({
    handleValidation: mockHandleValidation,
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

describe("CreationExNihiloIdentificationForm", () => {
  it("should pass structureVersion as defaultValues but override id with undefined", () => {
    // GIVEN
    const structureTransformation: StructureTransformationApiRead = {
      id: 7,
      type: StructureTransformationType.CREATION,
      structureVersion: {
        id: 999,
        structureId: 42,
        nom: "Les Coquelicots",
        creationDate: "2024-01-01T00:00:00.000Z",
      },
    };

    // WHEN
    render(
      <CreationExNihiloIdentificationForm
        structureTransformation={structureTransformation}
      />
    );

    // THEN
    expect(captured.defaultValues).toMatchObject({
      structureId: 42,
      nom: "Les Coquelicots",
      creationDate: "2024-01-01T00:00:00.000Z",
    });
    expect(captured.defaultValues?.id).toBeUndefined();
  });

  it("should duplicate creationDate into effectiveDate when submitting", () => {
    // GIVEN
    const structureTransformation: StructureTransformationApiRead = {
      id: 7,
      type: StructureTransformationType.CREATION,
      structureVersion: {},
    };
    render(
      <CreationExNihiloIdentificationForm
        structureTransformation={structureTransformation}
      />
    );

    // WHEN
    captured.onSubmit?.({
      nom: "Les Coquelicots",
      creationDate: "2024-01-01T00:00:00.000Z",
    });

    // THEN
    expect(mockHandleValidation).toHaveBeenCalledWith({
      nom: "Les Coquelicots",
      creationDate: "2024-01-01T00:00:00.000Z",
      effectiveDate: "2024-01-01T00:00:00.000Z",
    });
  });
});
