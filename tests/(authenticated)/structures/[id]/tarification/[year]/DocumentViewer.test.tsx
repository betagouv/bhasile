import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

import { DocumentViewer } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/DocumentViewer";

const mockFetch = vi.fn();
const mockWindowOpen = vi.fn();

const pdfFile = {
  key: "l48.pdf",
  originalName: "l48.pdf",
  mimeType: "application/pdf",
};
const docxFile = {
  key: "note.docx",
  originalName: "note.docx",
  mimeType:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const xlsxFile = {
  key: "bp.xlsx",
  originalName: "bp.xlsx",
  mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const answerWithLink = (url: string) =>
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ url }), { status: 200 })
  );

describe("DocumentViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    window.open = mockWindowOpen;
  });

  it("ne demande aucun lien à l'affichage, pour ne pas compter de fausse ouverture", () => {
    render(<DocumentViewer file={pdfFile} canOpen title="L48" />);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByTitle("L48")).not.toBeInTheDocument();
  });

  it("charge le document dans la visionneuse au clic, avec un lien d'affichage", async () => {
    answerWithLink("https://s3.example.com/inline");
    render(<DocumentViewer file={pdfFile} canOpen title="L48" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le document" })
    );

    await waitFor(() =>
      expect(screen.getByTitle("L48")).toHaveAttribute(
        "src",
        "https://s3.example.com/inline"
      )
    );
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/files/l48.pdf?getLink=true&inline=true"
    );
  });

  it("télécharge avec un lien normal", async () => {
    answerWithLink("https://s3.example.com/download");
    render(<DocumentViewer file={pdfFile} canOpen title="L48" />);

    await userEvent.click(screen.getByRole("button", { name: "Télécharger" }));

    await waitFor(() =>
      expect(mockWindowOpen).toHaveBeenCalledWith(
        "https://s3.example.com/download",
        "_blank",
        "noopener,noreferrer"
      )
    );
    expect(mockFetch).toHaveBeenCalledWith("/api/files/l48.pdf?getLink=true");
  });

  it("propose seulement le téléchargement pour un format non affichable", () => {
    render(<DocumentViewer file={docxFile} canOpen title="Note" />);

    expect(screen.getByText(/Aperçu indisponible/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ouvrir le document" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Télécharger" })
    ).toBeInTheDocument();
  });

  it("affiche un tableur après l'avoir lu par l'application, au clic seulement", async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ["Poste", "Montant"],
        ["Loyer", 1200],
      ]),
      "Budget"
    );
    mockFetch.mockResolvedValue({
      ok: true,
      blob: async () =>
        new Blob([XLSX.write(workbook, { type: "array", bookType: "xlsx" })]),
    });
    render(<DocumentViewer file={xlsxFile} canOpen title="BP" />);

    expect(mockFetch).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le document" })
    );

    expect(await screen.findByText("Loyer")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/files/bp.xlsx?getContent=true"
    );
    expect(screen.queryByTitle("BP")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ouvrir le document" })
    ).not.toBeInTheDocument();
  });

  it("désactive le bouton pendant l'ouverture, puis le rend après un échec", async () => {
    let answerContent: (response: Response) => void = () => {};
    mockFetch.mockReturnValue(
      new Promise((resolve) => {
        answerContent = resolve;
      })
    );
    render(<DocumentViewer file={xlsxFile} canOpen title="BP" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le document" })
    );

    expect(screen.getByRole("button", { name: "Ouverture…" })).toBeDisabled();

    answerContent(
      new Response(JSON.stringify({ error: "Panne" }), { status: 500 })
    );

    expect(
      await screen.findByRole("button", { name: "Ouvrir le document" })
    ).toBeEnabled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("propose le téléchargement quand un tableur est illisible", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["pas un tableur"]),
    });
    render(<DocumentViewer file={xlsxFile} canOpen title="BP" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le document" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "téléchargez-le"
    );
    expect(
      screen.getByRole("button", { name: "Télécharger" })
    ).toBeInTheDocument();
  });

  it("signale un lien refusé par le serveur", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: "Aucun fichier trouvé" }), {
        status: 404,
      })
    );
    render(<DocumentViewer file={pdfFile} canOpen title="L48" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Ouvrir le document" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "n’a pas pu être ouvert"
    );
  });

  it("ne laisse rien ouvrir d'un document retiré", () => {
    render(<DocumentViewer file={pdfFile} canOpen={false} title="L48" />);

    expect(screen.getByText(/a été retiré/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
