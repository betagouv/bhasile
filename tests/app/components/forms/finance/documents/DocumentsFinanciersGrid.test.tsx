import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FieldValues } from "react-hook-form";
import { FormTestWrapper } from "tests/test-utils/form-test-wrapper";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentsFinanciersGrid } from "@/app/components/forms/finance/documents/DocumentsFinanciersGrid";
import { FileUploadResponse } from "@/app/hooks/useFileUpload";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";

const mockUploadFile = vi.fn();
const mockDeleteFile = vi.fn();

vi.mock("@/app/hooks/useFileUpload", () => ({
  useFileUpload: () => ({
    uploadFile: mockUploadFile,
    deleteFile: mockDeleteFile,
    getDownloadLink: vi.fn(),
    getFile: vi.fn(),
  }),
}));

const YEAR = 2023;

const createFileUpload = (key: string): FileUploadResponse => ({
  id: 1,
  key,
  originalName: `${key}.pdf`,
  mimeType: "application/pdf",
  fileSize: 1024,
});

const createPdf = (name: string) =>
  new File(["contenu"], `${name}.pdf`, { type: "application/pdf" });

const renderGrid = ({
  documentsFinanciers = [],
  coveredDocumentsFinanciers,
  hasYearError,
}: {
  documentsFinanciers?: unknown[];
  coveredDocumentsFinanciers?: DocumentFinancierApiType[];
  hasYearError?: boolean;
} = {}) => {
  const onSubmit = vi.fn();
  render(
    <FormTestWrapper
      defaultValues={{ documentsFinanciers }}
      onSubmit={onSubmit}
    >
      <DocumentsFinanciersGrid
        year={YEAR}
        isAutorisee
        coveredDocumentsFinanciers={coveredDocumentsFinanciers}
        hasRequirement
        hasYearError={hasYearError}
      />
    </FormTestWrapper>
  );
  return { onSubmit };
};

const getBox = (name: RegExp) => screen.getByRole("group", { name });

const getFileInput = (box: HTMLElement) =>
  box.querySelector<HTMLInputElement>('input[type="file"]')!;

const submitAndGetDocuments = async (
  onSubmit: ReturnType<typeof vi.fn>
): Promise<FieldValues["documentsFinanciers"]> => {
  await userEvent.click(screen.getByRole("button", { name: "Valider" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  return onSubmit.mock.lastCall?.[0].documentsFinanciers;
};

describe("DocumentsFinanciersGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("retrouve un document enregistré dont le structureType revient à null", () => {
    renderGrid({
      documentsFinanciers: [
        {
          id: 10,
          year: YEAR,
          category: "BUDGET_PREVISIONNEL_DEMANDE",
          structureType: null,
          fileUploads: [createFileUpload("bp-demande")],
        },
      ],
    });

    const box = getBox(/^Budget prévisionnel demandé$/);
    expect(
      within(box).getByRole("button", { name: "bp-demande.pdf" })
    ).toBeInTheDocument();
  });

  it("ajoute le document de la boîte au formulaire après l'upload", async () => {
    mockUploadFile.mockResolvedValue(createFileUpload("compte-soumis"));
    const { onSubmit } = renderGrid();

    const box = getBox(/^Compte administratif soumis$/);
    await userEvent.upload(getFileInput(box), createPdf("compte-soumis"));

    expect(
      await within(box).findByRole("button", { name: "compte-soumis.pdf" })
    ).toBeInTheDocument();
    const documentsFinanciers = await submitAndGetDocuments(onSubmit);
    expect(documentsFinanciers).toEqual([
      expect.objectContaining({
        year: YEAR,
        category: "COMPTE_ADMINISTRATIF_SOUMIS",
        fileUploads: [expect.objectContaining({ key: "compte-soumis" })],
      }),
    ]);
  });

  it("conserve les deux fichiers quand deux uploads se terminent dans le désordre", async () => {
    const pendingUploads: Array<(fileUpload: FileUploadResponse) => void> = [];
    mockUploadFile.mockImplementation(
      () =>
        new Promise<FileUploadResponse>((resolve) => {
          pendingUploads.push(resolve);
        })
    );
    const { onSubmit } = renderGrid();

    await userEvent.upload(
      getFileInput(getBox(/^Budget prévisionnel demandé$/)),
      createPdf("premier")
    );
    await userEvent.upload(
      getFileInput(getBox(/^Rapport d'activité$/)),
      createPdf("second")
    );

    await act(async () => {
      pendingUploads[1](createFileUpload("second"));
    });
    await act(async () => {
      pendingUploads[0](createFileUpload("premier"));
    });

    const documentsFinanciers = await submitAndGetDocuments(onSubmit);
    expect(
      documentsFinanciers.map(
        (documentFinancier: { fileUploads: { key: string }[] }) =>
          documentFinancier.fileUploads[0].key
      )
    ).toEqual(["second", "premier"]);
  });

  it("supprime uniquement le document de la boîte", async () => {
    mockDeleteFile.mockResolvedValue(undefined);
    const autreDocument = {
      id: 2,
      year: YEAR,
      category: "AUTRE_FINANCIER",
      name: "Annexe",
      fileUploads: [createFileUpload("annexe")],
    };
    const otherYearDocument = {
      id: 3,
      year: YEAR - 1,
      category: "RAPPORT_ACTIVITE",
      fileUploads: [createFileUpload("rapport-annee-precedente")],
    };
    const { onSubmit } = renderGrid({
      documentsFinanciers: [
        {
          id: 1,
          year: YEAR,
          category: "RAPPORT_ACTIVITE",
          fileUploads: [createFileUpload("rapport")],
        },
        autreDocument,
        otherYearDocument,
      ],
    });

    const box = getBox(/^Rapport d'activité$/);
    await userEvent.click(
      within(box).getByRole("button", { name: "Supprimer rapport.pdf" })
    );

    expect(mockDeleteFile).toHaveBeenCalledWith("rapport");
    expect(await submitAndGetDocuments(onSubmit)).toEqual([
      autreDocument,
      otherYearDocument,
    ]);
  });

  it("signale un document requis quand seule une entrée sans fichier existe", () => {
    renderGrid({
      documentsFinanciers: [
        {
          id: 1,
          year: YEAR,
          category: "BUDGET_PREVISIONNEL_DEMANDE",
          fileUploads: [],
        },
      ],
      hasYearError: true,
    });

    const box = getBox(/^Budget prévisionnel demandé$/);
    expect(within(box).getAllByText("Ce document est requis")).not.toHaveLength(
      0
    );
    expect(box).toHaveAttribute("data-form-error");
    expect(getBox(/^Rapport budgétaire/)).not.toHaveAttribute(
      "data-form-error"
    );
  });

  it("indique qu'un document couvert par le CPOM est déjà transmis", () => {
    renderGrid({
      coveredDocumentsFinanciers: [
        {
          year: YEAR,
          category: "COMPTE_ADMINISTRATIF_RETENU",
          fileUploads: [{ key: "cpom-ca-retenu" }],
        },
      ],
      hasYearError: true,
    });

    const box = getBox(/^Compte administratif retenu \(optionnel\)$/);
    expect(box).not.toHaveAttribute("data-form-error");
    expect(
      screen.getByText("Déjà transmis au niveau du CPOM")
    ).toBeInTheDocument();
  });

  it("crée l'autre document à la première frappe sans perdre le focus", async () => {
    const { onSubmit } = renderGrid();

    const nameInput = screen.getByLabelText(/Nom du document/);
    await userEvent.type(nameInput, "Annexe");

    expect(screen.getByLabelText(/Nom du document/)).toHaveFocus();
    expect(screen.getByLabelText(/Nom du document/)).toHaveValue("Annexe");
    expect(await submitAndGetDocuments(onSubmit)).toEqual([
      expect.objectContaining({
        year: YEAR,
        category: "AUTRE_FINANCIER",
        name: "Annexe",
      }),
    ]);
  });

  it("distingue la suppression du fichier de celle de la ligne", async () => {
    mockDeleteFile.mockResolvedValue(undefined);
    const { onSubmit } = renderGrid({
      documentsFinanciers: [
        {
          id: 1,
          year: YEAR,
          category: "AUTRE_FINANCIER",
          name: "Premier",
          fileUploads: [createFileUpload("premier")],
        },
        {
          id: 2,
          year: YEAR,
          category: "AUTRE_FINANCIER",
          name: "Second",
          fileUploads: [createFileUpload("second")],
        },
      ],
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Supprimer premier.pdf" })
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Supprimer la ligne Second" })
    );

    expect(mockDeleteFile).toHaveBeenCalledWith("premier");
    expect(mockDeleteFile).toHaveBeenCalledWith("second");
    expect(await submitAndGetDocuments(onSubmit)).toEqual([
      expect.objectContaining({ id: 1, name: "Premier", fileUploads: [] }),
    ]);
  });

  it("ne recrée pas une ligne supprimée pendant son upload", async () => {
    let resolveUpload: (fileUpload: FileUploadResponse) => void = () => {};
    mockUploadFile.mockImplementation(
      () =>
        new Promise<FileUploadResponse>((resolve) => {
          resolveUpload = resolve;
        })
    );
    const { onSubmit } = renderGrid({
      documentsFinanciers: [
        { id: 1, year: YEAR, category: "AUTRE_FINANCIER", name: "Premier" },
        { id: 2, year: YEAR, category: "AUTRE_FINANCIER", name: "Second" },
      ],
    });

    const secondRowBox = screen.getAllByRole("group", { name: "Document" })[1];
    await userEvent.upload(getFileInput(secondRowBox), createPdf("tardif"));
    await userEvent.click(
      screen.getByRole("button", { name: "Supprimer la ligne Second" })
    );
    await act(async () => {
      resolveUpload(createFileUpload("tardif"));
    });

    expect(await submitAndGetDocuments(onSubmit)).toEqual([
      expect.objectContaining({ id: 1, name: "Premier" }),
    ]);
  });

  it("affiche une erreur quand la suppression du fichier de la ligne échoue", async () => {
    mockDeleteFile.mockRejectedValue(new Error("Erreur serveur (500)"));
    renderGrid({
      documentsFinanciers: [
        { id: 1, year: YEAR, category: "AUTRE_FINANCIER", name: "Premier" },
        {
          id: 2,
          year: YEAR,
          category: "AUTRE_FINANCIER",
          name: "Second",
          fileUploads: [createFileUpload("second")],
        },
      ],
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Supprimer la ligne Second" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Erreur lors de la suppression du fichier"
    );
    expect(screen.getByDisplayValue("Second")).toBeInTheDocument();
  });

  it("redonne le focus au bouton d'ajout après la suppression d'une ligne", async () => {
    renderGrid({
      documentsFinanciers: [
        { id: 1, year: YEAR, category: "AUTRE_FINANCIER", name: "Premier" },
        { id: 2, year: YEAR, category: "AUTRE_FINANCIER", name: "Second" },
      ],
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Supprimer la ligne Second" })
    );

    expect(
      screen.getByRole("button", { name: "Ajouter un autre document" })
    ).toHaveFocus();
  });
});
