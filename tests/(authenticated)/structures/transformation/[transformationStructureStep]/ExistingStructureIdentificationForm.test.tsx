import { render } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ExistingStructureIdentificationForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/ExistingStructureIdentificationForm";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { FormKind } from "@/types/global";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockGoToNextStep = vi.fn();
const mockHandleSave = vi.fn();

vi.mock("@/app/hooks/useTransformationFormHandling", () => ({
  useTransformationFormHandling: () => ({
    goToNextStep: mockGoToNextStep,
    handleSave: mockHandleSave,
    shouldShowIncompleteSteps: false,
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

const capturedSaver: {
  onSave?: (data: Record<string, unknown>, values: unknown) => void;
} = {};

vi.mock("@/app/components/forms/TransformationFormController", () => ({
  TransformationFormController: ({
    onSave,
  }: {
    onSave: (data: Record<string, unknown>, values: unknown) => void;
  }) => {
    capturedSaver.onSave = onSave;
    return null;
  },
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

const renderForm = () => {
  const structureVersionTransformation: StructureVersionTransformationApiRead = {
    id: 7,
    type: StructureVersionTransformationType.CONTRACTION,
    structureVersion: { id: 999 },
  };
  const transformation: TransformationApiRead = {
    id: 12,
    type: TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES,
    structureVersionTransformations: [structureVersionTransformation],
  };
  render(
    <ExistingStructureIdentificationForm
      transformation={transformation}
      structureVersionTransformation={structureVersionTransformation}
      formKind={FormKind.CONTRACTION}
    />
  );
};

describe("ExistingStructureIdentificationForm", () => {
  it("passe le structureVersion (et son id) en defaultValues", () => {
    // GIVEN
    const structureVersionTransformation: StructureVersionTransformationApiRead = {
      id: 7,
      type: StructureVersionTransformationType.EXTENSION,
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
      structureVersionTransformations: [structureVersionTransformation],
    };

    // WHEN
    render(
      <ExistingStructureIdentificationForm
        transformation={transformation}
        structureVersionTransformation={structureVersionTransformation}
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

  it("délègue la navigation à goToNextStep au submit", () => {
    // GIVEN
    renderForm();

    // WHEN
    captured.onSubmit?.({});

    // THEN
    expect(mockGoToNextStep).toHaveBeenCalledTimes(1);
  });

  it("construit le payload (effectiveDate, type, sans creationDate) et le transmet à handleSave avec le schema strict et les valeurs brutes", () => {
    // GIVEN
    renderForm();
    const rawValues = {
      id: 999,
      nom: "Les Mimosas",
      effectiveDate: "2026-08-25T00:00:00.000Z",
    };

    // WHEN — the shared saver runs with the parsed draft data and the raw values
    capturedSaver.onSave?.(
      {
        id: 999,
        nom: "Les Mimosas",
        effectiveDate: "2026-08-25T00:00:00.000Z",
      },
      rawValues
    );

    // THEN
    expect(mockHandleSave).toHaveBeenCalledWith({
      transformationId: 12,
      structureVersionTransformation: {
        id: 7,
        type: StructureVersionTransformationType.CONTRACTION,
        structureVersion: {
          id: 999,
          nom: "Les Mimosas",
          dnaStructures: undefined,
          effectiveDate: "2026-08-25T00:00:00.000Z",
        },
      },
      strictSchema: expect.anything(),
      values: rawValues,
    });
  });
});
