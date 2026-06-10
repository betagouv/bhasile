import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createStructureVersionTransformation,
  createTransformation,
} from "tests/test-utils/factories/transformation.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationClientProvider } from "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";
import { TransformationActesAdministratifsForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/TransformationActesAdministratifsForm";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockUpdateTransformation = vi.fn();
const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({
    transformationStructureType: StructureVersionTransformationType.CREATION,
    transformationStructureId: "7",
    transformationStructureStep:
      StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
  }),
  usePathname: () =>
    "/structures/transformation/12/creation/7/actes-administratifs",
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn() }),
  notFound: vi.fn(),
}));

vi.mock("@/app/hooks/useTransformations", () => ({
  useTransformations: () => ({
    updateTransformation: mockUpdateTransformation,
  }),
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
    structureVersionTransformations: [
      createStructureVersionTransformation({
        id: 7,
        type: StructureVersionTransformationType.CREATION,
        actesAdministratifs,
      }),
    ],
  });

const renderForm = (transformation: TransformationApiRead) =>
  render(
    <TransformationClientProvider transformation={transformation}>
      <TransformationActesAdministratifsForm
        structureVersionTransformation={
          transformation.structureVersionTransformations[0]
        }
        transformation={transformation}
      />
    </TransformationClientProvider>
  );

const getSavedActes = () => {
  const [, payload] = mockUpdateTransformation.mock.calls[0];
  return payload.structureVersionTransformations[0].actesAdministratifs;
};

describe("TransformationActesAdministratifsForm (integration via FormWrapper)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateTransformation.mockResolvedValue(12);
    localStorage.clear();
  });

  it("saves the filled acts, dropping the empty Autres documents row", async () => {
    // GIVEN the three required acts are filled (file + dates), Autres documents left empty
    const transformation = transformationWithActes([
      filledActe(1, "ARRETE_AUTORISATION", "k-autorisation"),
      filledActe(2, "CONVENTION", "k-convention"),
      filledActe(3, "ARRETE_TARIFICATION", "k-tarification"),
    ]);
    renderForm(transformation);

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the form saves the payload (empty AUTRE filtered out by the schema)
    await waitFor(() => expect(mockUpdateTransformation).toHaveBeenCalledTimes(1));
    const actes = getSavedActes();
    expect(actes).toHaveLength(3);
    expect(
      actes.map((acte: { category: string }) => acte.category).sort()
    ).toEqual(["ARRETE_AUTORISATION", "ARRETE_TARIFICATION", "CONVENTION"]);
  });

  it("still navigates to the next step when the required documents are missing", async () => {
    // GIVEN no acts provided -> the form seeds empty rows for each required category
    const transformation = transformationWithActes([]);
    renderForm(transformation);

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the incomplete step is saved and the user moves on (no blocking)
    await waitFor(() => expect(mockUpdateTransformation).toHaveBeenCalledTimes(1));
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/structures/transformation/12/verification"
    );
  });

  it("renders the autorisation/fusion radio for non-ex-nihilo creations with autorisation preselected by default", async () => {
    const transformation = transformationWithActes(
      [],
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
    );
    renderForm(transformation);

    // Autorisation is the default selection, fusion is the alternative
    const autorisationRadio = screen.getByRole("radio", {
      name: "Arrêté d'autorisation",
    });
    const fusionRadio = screen.getByRole("radio", {
      name: "Arrêté de fusion",
    });
    expect(autorisationRadio).toBeChecked();
    expect(fusionRadio).not.toBeChecked();
  });

  it("saves the ARRETE_FUSION category when the user picks fusion and fills the other required docs", async () => {
    const transformation = transformationWithActes(
      [
        filledActe(2, "CONVENTION", "k-convention"),
        filledActe(3, "ARRETE_TARIFICATION", "k-tarification"),
      ],
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
    );
    renderForm(transformation);

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

    await waitFor(() => expect(mockUpdateTransformation).toHaveBeenCalledTimes(1));
    const actes = getSavedActes();
    const radioActe = actes.find(
      (acte: { category: string }) =>
        acte.category === "ARRETE_FUSION" ||
        acte.category === "ARRETE_AUTORISATION"
    );
    expect(radioActe?.category).toBe("ARRETE_FUSION");
  });

  it("pre-selects the radio on the persisted category when navigating back to the step", () => {
    const transformation = transformationWithActes(
      [filledActe(1, "ARRETE_FUSION", "k-fusion")],
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
    );
    renderForm(transformation);

    expect(
      screen.getByRole("radio", { name: "Arrêté de fusion" })
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Arrêté d'autorisation" })
    ).not.toBeChecked();
  });
});
