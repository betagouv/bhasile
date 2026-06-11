import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
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

import { TransformationActesAdministratifsForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/TransformationActesAdministratifsForm";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { StepStatus } from "@/types/form.type";
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
    transformationStructureStep:
      StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
  }),
  usePathname: () =>
    "/structures/transformation/12/creation/7/actes-administratifs",
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn() }),
  notFound: vi.fn(),
}));

let fetchMock: ReturnType<typeof mockTransformationFetch>;

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
    id: TRANSFORMATION_ID,
    type,
    structureVersionTransformations: [
      createStructureVersionTransformation({
        id: 7,
        type: StructureVersionTransformationType.CREATION,
        actesAdministratifs,
        form: createStandardTransformationForm("structure-transformation-creation"),
      }),
    ],
  });

const renderForm = (transformation: TransformationApiRead) =>
  renderTransformationForm(
    transformation,
    <TransformationActesAdministratifsForm
      structureVersionTransformation={
        transformation.structureVersionTransformations[0]
      }
      transformation={transformation}
    />
  );

const getSavedActes = () =>
  getSavedStructureVersionTransformation(fetchMock, TRANSFORMATION_ID)
    .actesAdministratifs;

const getSavedActesStepStatus = () =>
  getSavedFormStepStatus(fetchMock, TRANSFORMATION_ID, "03-actes-administratifs");

describe("TransformationActesAdministratifsForm (integration up to fetch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID);
  });

  it("saves the filled acts, dropping the empty Autres documents row, and derives VALIDE", async () => {
    const transformation = transformationWithActes([
      filledActe(1, "ARRETE_AUTORISATION", "k-autorisation"),
      filledActe(2, "CONVENTION", "k-convention"),
      filledActe(3, "ARRETE_TARIFICATION", "k-tarification"),
    ]);
    renderForm(transformation);

    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    const actes = getSavedActes();
    expect(actes).toHaveLength(3);
    expect(
      actes.map((acte: { category: string }) => acte.category).sort()
    ).toEqual(["ARRETE_AUTORISATION", "ARRETE_TARIFICATION", "CONVENTION"]);
    expect(getSavedActesStepStatus()).toBe(StepStatus.VALIDE);
  });

  it("still navigates to the next step when the required documents are missing, step stays COMMENCE", async () => {
    const transformation = transformationWithActes([]);
    renderForm(transformation);

    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(getSavedActesStepStatus()).toBe(StepStatus.COMMENCE);
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

    await userEvent.click(
      screen.getByRole("radio", { name: "Arrêté de fusion" })
    );

    const startDateInputs = screen.getAllByLabelText("Début arrêté");
    const endDateInputs = screen.getAllByLabelText("Fin arrêté");
    await userEvent.type(startDateInputs[0], "2024-01-01");
    await userEvent.type(endDateInputs[0], "2025-01-01");

    const fileInputs = document.querySelectorAll(
      'input[name^="actesAdministratifs."][name$=".fileUploads.0.key"]'
    );
    const firstFileInput = fileInputs[0] as HTMLInputElement;
    await userEvent.type(firstFileInput, "k-fusion");

    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
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
