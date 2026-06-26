import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  getSavedStructureVersionTransformation,
  mockTransformationFetch,
  renderTransformationForm,
} from "tests/test-utils/transformationForm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExistingStructureIdentificationForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/ExistingStructureIdentificationForm";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { FormKind } from "@/types/global";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const TRANSFORMATION_ID = 12;
const STRUCTURE_VERSION_TRANSFORMATION_ID = 7;

vi.mock("next/navigation", () => ({
  useParams: () => ({
    transformationId: String(TRANSFORMATION_ID),
    transformationStructureType: StructureVersionTransformationType.CONTRACTION,
    transformationStructureId: String(STRUCTURE_VERSION_TRANSFORMATION_ID),
    transformationStructureStep: StructureVersionTransformationStep.DESCRIPTION,
  }),
  usePathname: () =>
    "/structures/transformation/12/contraction/7/description",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  notFound: vi.fn(),
}));

// Leaf field sets are stubbed: the integration target is the save chain, not their internals.
vi.mock("@/app/components/forms/EffectiveDateInput", () => ({
  EffectiveDateInput: () => null,
}));
vi.mock(
  "@/app/components/forms/adresseAdministrativeAndAntenne/TransformationAdresseAdministrative",
  () => ({
    TransformationAdresseAdministrative: () => null,
  })
);
vi.mock(
  "@/app/components/forms/dnaAndFiness/TransformationDnaAndFiness",
  () => ({
    TransformationDnaAndFiness: () => null,
  })
);
vi.mock("@/app/components/forms/contacts/FieldSetContacts", () => ({
  FieldSetContacts: () => null,
}));

let fetchMock: ReturnType<typeof mockTransformationFetch>;

const renderForm = (
  structureVersion: StructureVersionTransformationApiRead["structureVersion"]
) => {
  const structureVersionTransformation: StructureVersionTransformationApiRead = {
    id: STRUCTURE_VERSION_TRANSFORMATION_ID,
    type: StructureVersionTransformationType.CONTRACTION,
    structureVersion,
  };
  const transformation: TransformationApiRead = {
    id: TRANSFORMATION_ID,
    type: TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES,
    structureVersionTransformations: [structureVersionTransformation],
  };
  renderTransformationForm(
    transformation,
    <ExistingStructureIdentificationForm
      transformation={transformation}
      structureVersionTransformation={structureVersionTransformation}
      formKind={FormKind.CONTRACTION}
    />
  );
};

describe("ExistingStructureIdentificationForm (intégration jusqu'au fetch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID);
    localStorage.clear();
  });

  it("enregistre le structureVersion (effectiveDate, sans creationDate) jusqu'au fetch", async () => {
    // GIVEN an existing structure seeded from its source version
    renderForm({
      id: 999,
      structureId: 42,
      nom: "Les Mimosas",
      effectiveDate: "2026-08-25T00:00:00.000Z",
    });

    // WHEN the agent submits the step
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the built payload reaches the PUT, carrying effectiveDate (normalised to noon) and no creationDate
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    const structureVersionTransformation = getSavedStructureVersionTransformation(
      fetchMock,
      TRANSFORMATION_ID
    );
    expect(structureVersionTransformation.id).toBe(
      STRUCTURE_VERSION_TRANSFORMATION_ID
    );
    expect(structureVersionTransformation.type).toBe(
      StructureVersionTransformationType.CONTRACTION
    );
    expect(structureVersionTransformation.structureVersion).toMatchObject({
      id: 999,
      nom: "Les Mimosas",
      effectiveDate: "2026-08-25T12:00:00.000Z",
    });
    expect(
      structureVersionTransformation.structureVersion.creationDate
    ).toBeUndefined();
  });

  it("sauvegarde même quand tous les champs sont vides (null venant de la BDD)", async () => {
    // GIVEN a source version whose nullable columns are still null
    renderForm({
      id: 999,
      type: null,
      codeBhasile: null,
      nom: null,
      effectiveDate: null,
      adresseAdministrative: null,
      codePostalAdministratif: null,
      communeAdministrative: null,
      departementAdministratif: null,
    } as unknown as StructureVersionTransformationApiRead["structureVersion"]);

    // WHEN submitting without filling anything
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the draft save is not blocked: the PUT still leaves
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
  });
});
