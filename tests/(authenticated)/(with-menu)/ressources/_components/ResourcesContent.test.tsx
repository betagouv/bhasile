import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ResourcesContent } from "@/app/(authenticated)/(with-menu)/ressources/_components/ResourcesContent";
import { Block, FaqBlock, FilesBlock } from "@/types/ressources.type";

const searchParams = { value: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => searchParams.value,
}));

const FILES_BLOCK: FilesBlock = {
  id: "modeles",
  title: "Modèles",
  icon: "fr-icon-file-text-line",
  type: "fichiers",
  tabs: [
    {
      id: "modeles--actes",
      title: "Actes administratifs",
      sections: [
        {
          id: "modeles--actes--autorisees",
          title: "Structures autorisées",
          links: [
            {
              label: "Arrêté d’autorisation",
              href: "/arrete.odt",
              file: { extension: "ODT", bytes: 11825 },
              searchText: "modeles actes administratifs arrete d autorisation",
            },
            {
              label: "Webinaire du 12 mars",
              href: "https://webinaire.gouv.fr/xyz",
              file: null,
              searchText: "modeles actes administratifs webinaire du 12 mars",
            },
          ],
        },
      ],
    },
  ],
};

const FAQ_BLOCK: FaqBlock = {
  id: "faq",
  title: "FAQ",
  icon: "fr-icon-question-answer-line",
  type: "faq",
  tabs: [
    {
      id: "faq--cpom",
      title: "CPOM",
      questions: [
        {
          id: "faq--cpom--duree",
          title: "Quelle est la durée d’un CPOM ?",
          answerHtml: "<p>Cinq ans.</p>",
          searchText: "faq cpom quelle est la duree d un cpom cinq ans",
        },
      ],
    },
  ],
};

const BLOCKS: Block[] = [FILES_BLOCK, FAQ_BLOCK];

const renderWithSearch = (search: string) => {
  searchParams.value = new URLSearchParams(search ? { search } : {});
  return render(
    <ResourcesContent blocks={BLOCKS} suggestions={["CPOM", "OFII"]} />
  );
};

describe("ResourcesContent", () => {
  it("affiche tous les blocs quand aucune recherche n’est active", () => {
    // WHEN
    renderWithSearch("");

    // THEN
    expect(screen.getByText("Modèles")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
  });

  it("affiche le poids et le format d’un fichier téléchargeable", () => {
    // WHEN
    renderWithSearch("");

    // THEN
    expect(screen.getByText(/ODT/)).toBeInTheDocument();
    expect(screen.getByText(/11,8 kB/)).toBeInTheDocument();
  });

  it("n’affiche ni poids ni format pour un lien externe", () => {
    // WHEN
    renderWithSearch("");

    // THEN
    const externalLink = screen.getByRole("link", {
      name: /Webinaire du 12 mars/,
    });
    expect(externalLink).toHaveAttribute("target", "_blank");
    expect(externalLink.parentElement?.textContent).not.toMatch(/kB|MB/);
  });

  it("compte les liens de l’onglet dans la pastille", () => {
    // WHEN
    renderWithSearch("");

    // THEN
    expect(
      screen.getByRole("tab", { name: /Actes administratifs\s*2/ })
    ).toBeInTheDocument();
  });

  it("garde le bouton Rechercher visible pendant la saisie", async () => {
    // GIVEN
    renderWithSearch("");

    // WHEN
    await userEvent.type(screen.getByRole("searchbox"), "cpom");

    // THEN
    expect(
      screen.getByRole("button", { name: "Rechercher" })
    ).toBeInTheDocument();
  });

  it("remplit la recherche quand on clique sur une suggestion", async () => {
    // GIVEN
    renderWithSearch("");

    // WHEN
    await userEvent.click(screen.getByRole("button", { name: "CPOM" }));

    // THEN
    expect(screen.getByRole("searchbox")).toHaveValue("CPOM");
  });

  it("ne garde que les blocs correspondant à la recherche", () => {
    // WHEN
    renderWithSearch("cinq ans");

    // THEN
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.queryByText("Modèles")).not.toBeInTheDocument();
  });

  it("affiche un message d’absence de résultat avec le terme cherché", () => {
    // WHEN
    renderWithSearch("introuvable");

    // THEN
    expect(
      screen.getByText(/Aucun résultat pour « introuvable »/)
    ).toBeInTheDocument();
  });

  it("affiche un message dédié quand aucun contenu n’est publié", () => {
    // GIVEN
    searchParams.value = new URLSearchParams();

    // WHEN
    render(<ResourcesContent blocks={[]} suggestions={[]} />);

    // THEN
    expect(
      screen.getByText("Aucun contenu publié pour le moment.")
    ).toBeInTheDocument();
  });

  it("propose les recherches suggérées", () => {
    // WHEN
    renderWithSearch("");

    // THEN
    expect(screen.getByRole("button", { name: "CPOM" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OFII" })).toBeInTheDocument();
  });
});
