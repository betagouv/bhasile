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

import { CreationIdentificationForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation/CreationIdentificationForm";
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
    transformationStructureType: StructureVersionTransformationType.CREATION,
    transformationStructureId: "7",
    transformationStructureStep: StructureVersionTransformationStep.DESCRIPTION,
  }),
  usePathname: () => "/structures/transformation/12/creation/7/description",
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn() }),
  notFound: vi.fn(),
}));

vi.mock("@/app/components/forms/description/FieldSetDescription", () => ({
  FieldSetDescription: () => null,
}));
vi.mock(
  "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes",
  () => ({ AdresseAdministrativeAndAntennes: () => null })
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

const renderForm = (
  structureVersion: StructureVersion,
  operateur?: StructureVersionTransformationApiRead["operateur"]
) => {
  const structureVersionTransformation = createStructureVersionTransformation({
    id: 7,
    type: StructureVersionTransformationType.CREATION,
    operateur,
    structureVersion,
    form: createStandardTransformationForm("structure-transformation-creation"),
  });
  const transformation = createTransformation({
    id: TRANSFORMATION_ID,
    type: TransformationType.OUVERTURE_EX_NIHILO,
    structureVersionTransformations: [structureVersionTransformation],
  });
  return renderTransformationForm(
    transformation,
    <CreationIdentificationForm
      transformation={transformation}
      structureVersionTransformation={structureVersionTransformation}
      formKind={FormKind.OUVERTURE_EX_NIHILO}
    />
  );
};

const submit = () =>
  userEvent.click(screen.getByRole("button", { name: "Étape suivante" }));

describe("CreationIdentificationForm (integration up to fetch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID);
  });

  it("seeds the form from the structureVersion, persists the mapped defaults and navigates while the step stays COMMENCE", async () => {
    renderForm({
      id: 999,
      nom: "Les Coquelicots",
      creationDate: "2024-01-01T00:00:00.000Z",
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
      nom: "Les Coquelicots",
      creationDate: "2024-01-01T12:00:00.000Z",
      effectiveDate: "2024-01-01T12:00:00.000Z",
    });
    expect(
      getSavedFormStepStatus(fetchMock, TRANSFORMATION_ID, "01-identification")
    ).toBe(StepStatus.COMMENCE);
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/structures/transformation/12/creation/7/places-et-hebergement"
    );
  });

  it("maps the operateur id and persists only dna rows that have a code", async () => {
    renderForm(
      {
        id: 999,
        nom: "Les Coquelicots",
        dnaStructures: [{ dna: { code: "C0001" } }, { dna: {} }],
      } as unknown as StructureVersion,
      { id: 3, name: "Opérateur Test" }
    );

    await submit();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    const structureVersionTransformation =
      getSavedStructureVersionTransformation(fetchMock, TRANSFORMATION_ID);
    expect(structureVersionTransformation.operateurId).toBe(3);
    expect(
      structureVersionTransformation.structureVersion.dnaStructures
    ).toHaveLength(1);
    expect(
      structureVersionTransformation.structureVersion.dnaStructures[0].dna.code
    ).toBe("C0001");
  });

  it("derives the step VALIDE when the whole identification is complete", async () => {
    renderForm(
      completeIdentificationStructureVersion({
        creationDate: "2024-01-01T00:00:00.000Z",
      }),
      { id: 3, name: "Opérateur Test" }
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
