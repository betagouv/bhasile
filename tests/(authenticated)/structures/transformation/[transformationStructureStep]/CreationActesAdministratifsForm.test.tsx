import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createStructureTransformation,
  createTransformation,
} from "tests/test-utils/factories/transformation.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreationActesAdministratifsForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation/CreationActesAdministratifsForm";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockHandleValidation = vi.fn();

vi.mock("@/app/hooks/useTransformationFormHandling", () => ({
  useTransformationFormHandling: () => ({
    handleValidation: mockHandleValidation,
    prevStep: { route: "/prev-route" },
  }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ transformationStructureId: "7" }),
  useRouter: () => ({ push: vi.fn() }),
  notFound: vi.fn(),
}));

const filledActe = (
  id: number,
  category: ActeAdministratifCategory,
  key: string
): ActeAdministratifApiType => ({
  id,
  category,
  startDate: "2024-01-01T12:00:00.000Z",
  endDate: "2025-01-01T12:00:00.000Z",
  fileUploads: [{ id, key }],
});

const transformationWithActes = (
  actesAdministratifs: ActeAdministratifApiType[],
  type: TransformationType = TransformationType.OUVERTURE_EX_NIHILO
) =>
  createTransformation({
    id: 12,
    type,
    structureTransformations: [
      createStructureTransformation({
        id: 7,
        type: StructureTransformationType.CREATION,
        actesAdministratifs,
      }),
    ],
  });

describe("CreationActesAdministratifsForm (integration via FormWrapper)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("submits the filled acts to handleValidation, dropping the empty Autres documents row", async () => {
    // GIVEN the three required acts are filled (file + dates), Autres documents left empty
    const transformation = transformationWithActes([
      filledActe(1, "ARRETE_AUTORISATION", "k-autorisation"),
      filledActe(2, "CONVENTION", "k-convention"),
      filledActe(3, "ARRETE_TARIFICATION", "k-tarification"),
    ]);
    render(
      <CreationActesAdministratifsForm
        structureTransformation={transformation.structureTransformations[0]}
        transformation={transformation}
      />
    );

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the form validates and forwards the payload (empty AUTRE filtered out by the schema)
    await waitFor(() => expect(mockHandleValidation).toHaveBeenCalledTimes(1));
    const payload = mockHandleValidation.mock.calls[0][0];
    expect(payload.transformationId).toBe(12);
    expect(payload.structureTransformation.id).toBe(7);
    expect(payload.structureTransformation.type).toBe(
      StructureTransformationType.CREATION
    );
    const actes = payload.structureTransformation.actesAdministratifs;
    expect(actes).toHaveLength(3);
    expect(
      actes.map((acte: { category: string }) => acte.category).sort()
    ).toEqual(["ARRETE_AUTORISATION", "ARRETE_TARIFICATION", "CONVENTION"]);
  });

  it("does not submit when the required documents are missing", async () => {
    // GIVEN no acts provided -> the form seeds empty rows for each required category
    const transformation = transformationWithActes([]);
    render(
      <CreationActesAdministratifsForm
        structureTransformation={transformation.structureTransformations[0]}
        transformation={transformation}
      />
    );

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );
    // let the async zod validation settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    // THEN validation blocks the submission
    expect(mockHandleValidation).not.toHaveBeenCalled();
  });

  it("renders the autorisation/fusion radio for non-ex-nihilo creations with autorisation preselected by default", async () => {
    const transformation = transformationWithActes(
      [],
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
    );
    render(
      <CreationActesAdministratifsForm
        structureTransformation={transformation.structureTransformations[0]}
        transformation={transformation}
      />
    );

    // Autorisation is the default selection, fusion is the alternative
    const autorisationRadio = screen.getByRole("radio", {
      name: "Arrêté d'autorisation",
    });
    const fusionRadio = screen.getByRole("radio", {
      name: "Arrêté de fusion",
    });
    expect(autorisationRadio).toBeChecked();
    expect(fusionRadio).not.toBeChecked();

    // Submit without filling the docs -> blocked
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockHandleValidation).not.toHaveBeenCalled();
  });

  it("submits with category ARRETE_FUSION when the user picks fusion and fills the other required docs", async () => {
    const transformation = transformationWithActes(
      [
        filledActe(2, "CONVENTION", "k-convention"),
        filledActe(3, "ARRETE_TARIFICATION", "k-tarification"),
      ],
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
    );
    render(
      <CreationActesAdministratifsForm
        structureTransformation={transformation.structureTransformations[0]}
        transformation={transformation}
      />
    );

    // Pick fusion in the radio
    await userEvent.click(
      screen.getByRole("radio", { name: "Arrêté de fusion" })
    );

    // Fill the dates of the radio slot (the first DATE_START_END block)
    const startDateInputs = screen.getAllByLabelText("Début arrêté");
    const endDateInputs = screen.getAllByLabelText("Fin arrêté");
    await userEvent.type(startDateInputs[0], "2024-01-01");
    await userEvent.type(endDateInputs[0], "2025-01-01");

    // Stub the file upload by directly setting the hidden file key field
    const fileInputs = document.querySelectorAll(
      'input[name^="actesAdministratifs."][name$=".fileUploads.0.key"]'
    );
    // First one is the radio slot
    const firstFileInput = fileInputs[0] as HTMLInputElement;
    await userEvent.type(firstFileInput, "k-fusion");

    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    await waitFor(() => expect(mockHandleValidation).toHaveBeenCalledTimes(1));
    const payload = mockHandleValidation.mock.calls[0][0];
    const actes = payload.structureTransformation.actesAdministratifs;
    const radioActe = actes.find(
      (acte: { category: string }) =>
        acte.category === "ARRETE_FUSION" || acte.category === "ARRETE_AUTORISATION"
    );
    expect(radioActe?.category).toBe("ARRETE_FUSION");
  });

  it("pre-selects the radio on the persisted category when navigating back to the step", () => {
    const transformation = transformationWithActes(
      [filledActe(1, "ARRETE_FUSION", "k-fusion")],
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
    );
    render(
      <CreationActesAdministratifsForm
        structureTransformation={transformation.structureTransformations[0]}
        transformation={transformation}
      />
    );

    expect(
      screen.getByRole("radio", { name: "Arrêté de fusion" })
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Arrêté d'autorisation" })
    ).not.toBeChecked();
  });
});
