import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
