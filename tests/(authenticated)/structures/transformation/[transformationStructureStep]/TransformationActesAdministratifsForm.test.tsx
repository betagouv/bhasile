import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createStructureVersionTransformation,
  createTransformation,
} from "tests/test-utils/factories/transformation.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationActesAdministratifsForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/TransformationActesAdministratifsForm";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import {
  ActeAdministratifCategory,
  StructureParentActe,
} from "@/types/acte-administratif.type";
import {
  StructureVersionTransformationType,
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
    structureVersionTransformations: [
      createStructureVersionTransformation({
        id: 7,
        type: StructureVersionTransformationType.CREATION,
        actesAdministratifs,
      }),
    ],
  });

describe("TransformationActesAdministratifsForm (integration via FormWrapper)", () => {
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
      <TransformationActesAdministratifsForm
        structureVersionTransformation={
          transformation.structureVersionTransformations[0]
        }
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
    expect(payload.structureVersionTransformation.id).toBe(7);
    expect(payload.structureVersionTransformation.type).toBe(
      StructureVersionTransformationType.CREATION
    );
    const actes = payload.structureVersionTransformation.actesAdministratifs;
    expect(actes).toHaveLength(3);
    expect(
      actes.map((acte: { category: string }) => acte.category).sort()
    ).toEqual(["ARRETE_AUTORISATION", "ARRETE_TARIFICATION", "CONVENTION"]);
  });

  it("submits with no acts now that they are all optional for transformations", async () => {
    // GIVEN no acts provided -> the form seeds empty rows for each category
    const transformation = transformationWithActes([]);
    render(
      <TransformationActesAdministratifsForm
        structureVersionTransformation={
          transformation.structureVersionTransformations[0]
        }
        transformation={transformation}
      />
    );

    // WHEN submitting without filling anything
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN validation passes and forwards an empty actes payload (empty rows dropped)
    await waitFor(() => expect(mockHandleValidation).toHaveBeenCalledTimes(1));
    const payload = mockHandleValidation.mock.calls[0][0];
    expect(
      payload.structureVersionTransformation.actesAdministratifs
    ).toHaveLength(0);
  });

  it("renders the autorisation/fusion radio for non-ex-nihilo creations with autorisation preselected by default", async () => {
    const transformation = transformationWithActes(
      [],
      TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES
    );
    render(
      <TransformationActesAdministratifsForm
        structureVersionTransformation={
          transformation.structureVersionTransformations[0]
        }
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

    // Submit without filling the docs -> now allowed (acts are optional)
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );
    await waitFor(() => expect(mockHandleValidation).toHaveBeenCalledTimes(1));
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
      <TransformationActesAdministratifsForm
        structureVersionTransformation={
          transformation.structureVersionTransformations[0]
        }
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
    const actes = payload.structureVersionTransformation.actesAdministratifs;
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
    render(
      <TransformationActesAdministratifsForm
        structureVersionTransformation={
          transformation.structureVersionTransformations[0]
        }
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

type ReadStructureVersion =
  TransformationApiRead["structureVersionTransformations"][number]["structureVersion"];

const currentParentActe = (
  id: number,
  category: ActeAdministratifCategory
): StructureParentActe => ({
  id,
  category,
  startDate: "2020-01-01T12:00:00.000Z",
  endDate: "2099-12-31T12:00:00.000Z",
  children: [],
});

const extensionWithStructureActes = (
  structureActes: StructureParentActe[],
  savedActes: ActeAdministratifApiType[] = []
) =>
  createTransformation({
    id: 12,
    type: TransformationType.EXTENSION_EX_NIHILO,
    structureVersionTransformations: [
      createStructureVersionTransformation({
        id: 7,
        type: StructureVersionTransformationType.EXTENSION,
        actesAdministratifs: savedActes,
        structureVersion: {
          structure: { actesAdministratifs: structureActes },
        } as ReadStructureVersion,
      }),
    ],
  });

describe("TransformationActesAdministratifsForm — avenant alternative (extension)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the standalone/avenant radios with the standalone option preselected", () => {
    const transformation = extensionWithStructureActes([
      currentParentActe(99, "ARRETE_AUTORISATION"),
      currentParentActe(88, "CONVENTION"),
    ]);
    render(
      <TransformationActesAdministratifsForm
        structureVersionTransformation={
          transformation.structureVersionTransformations[0]
        }
        transformation={transformation}
      />
    );

    expect(screen.getByRole("radio", { name: "Convention" })).toBeChecked();
    // the avenant option shows the current parent acte's date range
    expect(
      screen.getByRole("radio", { name: "Avenant convention 2020 - 2099" })
    ).not.toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Arrêté d'extension" })
    ).toBeChecked();
    expect(
      screen.getByRole("radio", {
        name: "Avenant arrêté d'autorisation 2020 - 2099",
      })
    ).not.toBeChecked();

    expect(
      screen.getByText("Convention ou avenant convention")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Arrêté d'extension ou avenant arrêté d'autorisation")
    ).toBeInTheDocument();
  });

  it("hides the avenant option when the structure has no eligible parent acte", () => {
    const transformation = extensionWithStructureActes([]);
    render(
      <TransformationActesAdministratifsForm
        structureVersionTransformation={
          transformation.structureVersionTransformations[0]
        }
        transformation={transformation}
      />
    );

    expect(
      screen.queryByRole("radio", { name: "Avenant arrêté d'autorisation" })
    ).toBeNull();
    expect(
      screen.queryByRole("radio", { name: "Avenant convention" })
    ).toBeNull();
    // the standalone arrêté field is still rendered
    expect(screen.getByLabelText("Date arrêté")).toBeInTheDocument();
    // without an eligible parent, the legend stays the plain block title
    expect(
      screen.queryByText("Arrêté d'extension ou avenant arrêté d'autorisation")
    ).toBeNull();
    expect(
      screen.getByText("Arrêté d'extension", { selector: "legend" })
    ).toBeInTheDocument();
  });

  it("marks the acte as an avenant of the structure's current arrêté d'autorisation on submit", async () => {
    const transformation = extensionWithStructureActes([
      // expired -> not the current acte
      {
        id: 50,
        category: "ARRETE_AUTORISATION",
        startDate: "2000-01-01T12:00:00.000Z",
        endDate: "2005-01-01T12:00:00.000Z",
        children: [],
      },
      currentParentActe(99, "ARRETE_AUTORISATION"),
    ]);
    render(
      <TransformationActesAdministratifsForm
        structureVersionTransformation={
          transformation.structureVersionTransformations[0]
        }
        transformation={transformation}
      />
    );

    // pick the avenant option for the arrêté block
    await userEvent.click(
      screen.getByRole("radio", {
        name: "Avenant arrêté d'autorisation 2020 - 2099",
      })
    );

    // fill its single date + file
    await userEvent.type(screen.getByLabelText("Date arrêté"), "2024-03-15");
    const arreteFileInput = document.querySelector(
      'input[name="actesAdministratifs.1.fileUploads.0.key"]'
    ) as HTMLInputElement;
    await userEvent.type(arreteFileInput, "k-avenant");

    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    await waitFor(() => expect(mockHandleValidation).toHaveBeenCalledTimes(1));
    const actes =
      mockHandleValidation.mock.calls[0][0].structureVersionTransformation
        .actesAdministratifs;
    const avenant = actes.find(
      (acte: { category: string }) => acte.category === "ARRETE_AUTORISATION"
    );
    expect(avenant).toBeDefined();
    // id 99 is the arrêté d'autorisation in effect today; id 50 is expired
    expect(avenant.parentId).toBe(99);
  });

  it("still renders a saved avenant as a single-date acte when its structure parent is gone", () => {
    // The structure's parent acte was deleted/changed, so no eligible parent resolves,
    // but a previously-saved avenant must remain visible (not silently dropped).
    const transformation = extensionWithStructureActes(
      [],
      [
        {
          id: 5,
          category: "ARRETE_AUTORISATION",
          parentId: 99,
          date: "2024-03-15T12:00:00.000Z",
          fileUploads: [{ id: 5, key: "k-orphan" }],
        },
      ]
    );
    render(
      <TransformationActesAdministratifsForm
        structureVersionTransformation={
          transformation.structureVersionTransformations[0]
        }
        transformation={transformation}
      />
    );

    // Rendered as an avenant: single "Date arrêté", never the start/end pair.
    expect(screen.getByLabelText("Date arrêté")).toBeInTheDocument();
    expect(screen.queryByLabelText("Début arrêté")).toBeNull();
    // The "create avenant" choice is hidden — there is no live parent to amend.
    expect(
      screen.queryByRole("radio", { name: "Avenant arrêté d'autorisation" })
    ).toBeNull();
  });
});
