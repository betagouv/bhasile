import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createStructureVersionTransformation,
  createTransformation,
} from "tests/test-utils/factories/transformation.factory";
import {
  getSavedStructureVersionTransformation,
  mockTransformationFetch,
  renderTransformationForm,
} from "tests/test-utils/transformationForm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationActesAdministratifsForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/shared/TransformationActesAdministratifsForm";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import {
  ActeAdministratifCategory,
  StructureParentActe,
} from "@/types/acte-administratif.type";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const TRANSFORMATION_ID = 12;

const mockRouterPush = vi.fn();
const mockUseParams = vi.fn();
const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
  usePathname: () => mockUsePathname(),
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

const waitForSavePut = () =>
  waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/transformations/${TRANSFORMATION_ID}`,
      expect.objectContaining({ method: "PUT" })
    )
  );

describe("TransformationActesAdministratifsForm (intégration jusqu'au fetch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID);
    mockUseParams.mockReturnValue({
      transformationStructureType: StructureVersionTransformationType.CREATION,
      transformationStructureId: "7",
      transformationStructureStep:
        StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
    });
    mockUsePathname.mockReturnValue(
      "/structures/transformation/12/creation/7/actes-administratifs"
    );
    localStorage.clear();
  });

  it("enregistre les actes remplis, en écartant la ligne Autres documents vide", async () => {
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
    await waitForSavePut();
    const actes = getSavedActes();
    expect(actes).toHaveLength(3);
    expect(
      actes.map((acte: { category: string }) => acte.category).sort()
    ).toEqual(["ARRETE_AUTORISATION", "ARRETE_TARIFICATION", "CONVENTION"]);
  });

  it("navigue quand même vers l'étape suivante quand les documents requis sont absents", async () => {
    // GIVEN no acts provided -> the form seeds empty rows for each required category
    const transformation = transformationWithActes([]);
    renderForm(transformation);

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the incomplete step is saved and the user moves on (no blocking)
    await waitForSavePut();
    await waitFor(() =>
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/structures/transformation/12/verification"
      )
    );
  });

  it("affiche le radio autorisation/fusion pour les créations non ex-nihilo, avec autorisation présélectionnée par défaut", async () => {
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

  it("enregistre la catégorie ARRETE_FUSION quand l'utilisateur choisit fusion et remplit les autres documents requis", async () => {
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

    await waitForSavePut();
    const actes = getSavedActes();
    const radioActe = actes.find(
      (acte: { category: string }) =>
        acte.category === "ARRETE_FUSION" ||
        acte.category === "ARRETE_AUTORISATION"
    );
    expect(radioActe?.category).toBe("ARRETE_FUSION");
  });

  it("présélectionne le radio sur la catégorie enregistrée au retour sur l'étape", () => {
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
    id: TRANSFORMATION_ID,
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

describe("TransformationActesAdministratifsForm — alternative avenant (extension)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID);
    mockUseParams.mockReturnValue({
      transformationStructureType: StructureVersionTransformationType.EXTENSION,
      transformationStructureId: "7",
      transformationStructureStep:
        StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
    });
    mockUsePathname.mockReturnValue(
      "/structures/transformation/12/extension/7/actes-administratifs"
    );
    localStorage.clear();
  });

  it("affiche les radios autonome/avenant avec l'option autonome présélectionnée", () => {
    const transformation = extensionWithStructureActes([
      currentParentActe(99, "ARRETE_AUTORISATION"),
      currentParentActe(88, "CONVENTION"),
    ]);
    renderForm(transformation);

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

  it("masque l'option avenant quand la structure n'a pas d'acte parent éligible", () => {
    const transformation = extensionWithStructureActes([]);
    renderForm(transformation);

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

  it("marque l'acte comme avenant de l'arrêté d'autorisation en cours de la structure à la soumission", async () => {
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
    renderForm(transformation);

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

    await waitForSavePut();
    const actes = getSavedActes();
    const avenant = actes.find(
      (acte: { category: string }) => acte.category === "ARRETE_AUTORISATION"
    );
    expect(avenant).toBeDefined();
    // id 99 is the arrêté d'autorisation in effect today; id 50 is expired
    expect(avenant.parentId).toBe(99);
  });

  it("affiche tout de même un avenant enregistré comme un acte à date unique quand son parent de structure a disparu", () => {
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
    renderForm(transformation);

    // Rendered as an avenant: single "Date arrêté", never the start/end pair.
    expect(screen.getByLabelText("Date arrêté")).toBeInTheDocument();
    expect(screen.queryByLabelText("Début arrêté")).toBeNull();
    // The "create avenant" choice is hidden — there is no live parent to amend.
    expect(
      screen.queryByRole("radio", { name: "Avenant arrêté d'autorisation" })
    ).toBeNull();
  });
});
