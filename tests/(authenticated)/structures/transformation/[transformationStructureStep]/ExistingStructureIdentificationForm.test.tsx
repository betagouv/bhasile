import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  completeIdentificationStructureVersion,
  createStandardTransformationForm,
  createStructureVersionTransformation,
  createTransformation,
} from "tests/test-utils/factories/transformation.factory";
import {
  getSavedFormStepStatus,
  getSavedStructureVersionTransformation,
  mockTransformationFetch,
  renderTransformationForm,
} from "tests/test-utils/transformationForm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExistingStructureIdentificationForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/ExistingStructureIdentificationForm";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import { FormKind } from "@/types/global";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const TRANSFORMATION_ID = 12;
const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({
    transformationStructureType: StructureVersionTransformationType.CONTRACTION,
    transformationStructureId: "7",
    transformationStructureStep: StructureVersionTransformationStep.DESCRIPTION,
  }),
  usePathname: () => "/structures/transformation/12/contraction/7/description",
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn() }),
  notFound: vi.fn(),
}));

vi.mock("@/app/components/forms/EffectiveDateInput", () => ({
  EffectiveDateInput: () => null,
}));
vi.mock(
  "@/app/components/forms/adresseAdministrativeAndAntenne/TransformationAdresseAdministrative",
  () => ({ TransformationAdresseAdministrative: () => null })
);
vi.mock("@/app/components/forms/dnaAndFiness/DnaAndFiness", () => ({
  DnaAndFiness: () => null,
}));
vi.mock("@/app/components/forms/contacts/FieldSetContacts", () => ({
  FieldSetContacts: () => null,
}));

type StructureVersion = NonNullable<
  StructureVersionTransformationApiRead["structureVersion"]
>;

let fetchMock: ReturnType<typeof mockTransformationFetch>;

const renderForm = (structureVersion: StructureVersion) => {
  const structureVersionTransformation = createStructureVersionTransformation({
    id: 7,
    type: StructureVersionTransformationType.CONTRACTION,
    structureVersion,
    form: createStandardTransformationForm(
      "structure-transformation-contraction"
    ),
  });
  const transformation = createTransformation({
    id: TRANSFORMATION_ID,
    type: TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES,
    structureVersionTransformations: [structureVersionTransformation],
  });
  return renderTransformationForm(
    transformation,
    <ExistingStructureIdentificationForm
      transformation={transformation}
      structureVersionTransformation={structureVersionTransformation}
      formKind={FormKind.CONTRACTION}
    />
  );
};

const submit = () =>
  userEvent.click(screen.getByRole("button", { name: "Étape suivante" }));

describe("ExistingStructureIdentificationForm (integration up to fetch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID);
  });

  it("seeds from the structureVersion, persists effectiveDate (no creationDate) and navigates while the step stays COMMENCE", async () => {
    renderForm({
      id: 999,
      nom: "Les Mimosas",
      effectiveDate: "2026-08-25T00:00:00.000Z",
    } as unknown as StructureVersion);

    await submit();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    const structureVersionTransformation =
      getSavedStructureVersionTransformation(fetchMock, TRANSFORMATION_ID);
    expect(structureVersionTransformation.structureVersion).toMatchObject({
      id: 999,
      nom: "Les Mimosas",
      effectiveDate: "2026-08-25T12:00:00.000Z",
    });
    expect(
      structureVersionTransformation.structureVersion.creationDate
    ).toBeUndefined();
    expect(
      getSavedFormStepStatus(fetchMock, TRANSFORMATION_ID, "01-identification")
    ).toBe(StepStatus.COMMENCE);
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/structures/transformation/12/contraction/7/places-et-hebergement"
    );
  });

  it("derives the step VALIDE when the whole identification is complete", async () => {
    renderForm(
      completeIdentificationStructureVersion({
        effectiveDate: "2026-08-25T00:00:00.000Z",
        nom: "Les Mimosas",
      })
    );

    await submit();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(
      getSavedFormStepStatus(fetchMock, TRANSFORMATION_ID, "01-identification")
    ).toBe(StepStatus.VALIDE);
  });
});
