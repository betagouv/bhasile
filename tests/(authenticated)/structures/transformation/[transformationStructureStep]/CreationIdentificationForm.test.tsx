import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  getSavedStructureVersionTransformation,
  mockTransformationFetch,
  renderTransformationForm,
} from "tests/test-utils/transformationForm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreationIdentificationForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation/CreationIdentificationForm";
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
    transformationStructureType: StructureVersionTransformationType.CREATION,
    transformationStructureId: String(STRUCTURE_VERSION_TRANSFORMATION_ID),
    transformationStructureStep: StructureVersionTransformationStep.DESCRIPTION,
  }),
  usePathname: () =>
    "/structures/transformation/12/creation/7/description",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  notFound: vi.fn(),
}));

// Leaf field sets are stubbed: the integration target is the save chain, not their internals.
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
  DnaAndFiness: () => <div data-testid="dna-and-finess" />,
}));
vi.mock("@/app/components/forms/dnaAndFiness/TransformationDnaAndFiness", () => ({
  TransformationDnaAndFiness: () => (
    <div data-testid="transformation-dna-and-finess" />
  ),
}));
vi.mock("@/app/components/forms/contacts/FieldSetContacts", () => ({
  FieldSetContacts: () => null,
}));

let fetchMock: ReturnType<typeof mockTransformationFetch>;

const buildTransformation = (
  structureVersion: StructureVersionTransformationApiRead["structureVersion"]
): TransformationApiRead => {
  const structureVersionTransformation: StructureVersionTransformationApiRead = {
    id: STRUCTURE_VERSION_TRANSFORMATION_ID,
    type: StructureVersionTransformationType.CREATION,
    structureVersion,
  };
  return {
    id: TRANSFORMATION_ID,
    type: TransformationType.OUVERTURE_EX_NIHILO,
    structureVersionTransformations: [structureVersionTransformation],
  };
};

const renderForm = (
  formKind: FormKind = FormKind.OUVERTURE_EX_NIHILO,
  structureVersion: StructureVersionTransformationApiRead["structureVersion"] = {
    id: 999,
  }
) => {
  const transformation = buildTransformation(structureVersion);
  renderTransformationForm(
    transformation,
    <CreationIdentificationForm
      transformation={transformation}
      structureVersionTransformation={
        transformation.structureVersionTransformations[0]
      }
      formKind={formKind}
    />
  );
};

describe("CreationIdentificationForm (intégration jusqu'au fetch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID);
    localStorage.clear();
  });

  it("lit la date depuis effectiveDate de la version et la renvoie sur effectiveDate (plus de creationDate sur la version)", async () => {
    // GIVEN a creation seeded from a structureVersion whose effectiveDate carries the creation date
    renderForm(FormKind.OUVERTURE_EX_NIHILO, {
      id: 999,
      structureId: 42,
      nom: "Les Coquelicots",
      effectiveDate: "2024-01-01T00:00:00.000Z",
    });

    // WHEN the agent submits the step
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the built payload reaches the PUT, with creationDate mirrored on effectiveDate
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
      StructureVersionTransformationType.CREATION
    );
    // the date input passes through frenchDateToISO (draft schema) → normalised to noon,
    // and lands only on effectiveDate (creationDate n'est plus écrit sur la version)
    expect(structureVersionTransformation.structureVersion).toMatchObject({
      id: 999,
      nom: "Les Coquelicots",
      effectiveDate: "2024-01-01T12:00:00.000Z",
    });
    expect(structureVersionTransformation.structureVersion).not.toHaveProperty(
      "creationDate"
    );
  });

  it("affiche DnaAndFiness pour une ouverture ex nihilo", () => {
    renderForm(FormKind.OUVERTURE_EX_NIHILO);

    expect(screen.getByTestId("dna-and-finess")).toBeInTheDocument();
    expect(
      screen.queryByTestId("transformation-dna-and-finess")
    ).not.toBeInTheDocument();
  });

  it("affiche TransformationDnaAndFiness pour une ouverture depuis une ou plusieurs structures", () => {
    renderForm(FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES);

    expect(
      screen.getByTestId("transformation-dna-and-finess")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("dna-and-finess")).not.toBeInTheDocument();
  });

  it("sauvegarde même quand tous les champs sont vides, y compris les null venant de la BDD", async () => {
    // GIVEN a freshly created version where the DB columns are still null and the
    // operateur is a present-but-empty object (the autocomplete was never filled)
    const structureVersionTransformation = {
      id: STRUCTURE_VERSION_TRANSFORMATION_ID,
      type: StructureVersionTransformationType.CREATION,
      operateur: { id: null, name: null },
      structureVersion: {
        id: 999,
        type: null,
        codeBhasile: null,
        nom: null,
        creationDate: null,
        adresseAdministrative: null,
        codePostalAdministratif: null,
        communeAdministrative: null,
        departementAdministratif: null,
      },
    } as unknown as StructureVersionTransformationApiRead;
    const transformation = {
      id: TRANSFORMATION_ID,
      type: TransformationType.OUVERTURE_EX_NIHILO,
      structureVersionTransformations: [structureVersionTransformation],
    } as TransformationApiRead;

    renderTransformationForm(
      transformation,
      <CreationIdentificationForm
        transformation={transformation}
        structureVersionTransformation={structureVersionTransformation}
        formKind={FormKind.OUVERTURE_EX_NIHILO}
      />
    );

    // WHEN the agent submits the step without filling anything
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
