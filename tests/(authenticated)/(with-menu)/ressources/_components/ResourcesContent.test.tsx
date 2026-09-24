import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ResourcesContent } from "@/app/(authenticated)/(with-menu)/ressources/_components/ResourcesContent";
import { FaqApiType } from "@/schemas/api/faq.schema";
import { Block, FilesBlock } from "@/types/ressources.type";

const mockedSearchParams = { searchParamsValue: new URLSearchParams() };
const mockedFaqItems: { value: FaqApiType[] | undefined } = { value: [] };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => mockedSearchParams.searchParamsValue,
}));

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: vi.fn() }),
}));

vi.mock("@/hooks/useFaqItems", () => ({
  useFaqItems: () => ({ faqItems: mockedFaqItems.value }),
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

const FAQ_ITEMS: FaqApiType[] = [
  {
    id: 1,
    question: "Qu'est-ce qu'un CPOM ?",
    contentMarkdown: "Un contrat pluriannuel d'objectifs et de moyens.",
    category: "CPOM",
  },
];

const BLOCKS: Block[] = [FILES_BLOCK];

const renderResourcesContentWithSearch = (
  searchQueryText: string,
  faqItems: FaqApiType[] | undefined = FAQ_ITEMS
) => {
  mockedSearchParams.searchParamsValue = new URLSearchParams(
    searchQueryText ? { search: searchQueryText } : {}
  );
  mockedFaqItems.value = faqItems;
  return render(
    <ResourcesContent blocks={BLOCKS} suggestions={["CPOM", "OFII"]} />
  );
};

describe("ResourcesContent", () => {
  it("affiche tous les blocs quand aucune recherche n’est active", () => {
    // WHEN
    renderResourcesContentWithSearch("");

    // THEN
    expect(screen.getByText("Modèles")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
  });

  it("affiche le poids et le format d’un fichier téléchargeable", () => {
    // WHEN
    renderResourcesContentWithSearch("");

    // THEN
    expect(screen.getByText(/ODT/)).toBeInTheDocument();
    expect(screen.getByText(/11,8 kB/)).toBeInTheDocument();
  });

  it("n’affiche ni poids ni format pour un lien externe", () => {
    // WHEN
    renderResourcesContentWithSearch("");

    // THEN
    const externalLink = screen.getByRole("link", {
      name: /Webinaire du 12 mars/,
    });
    expect(externalLink).toHaveAttribute("target", "_blank");
    expect(externalLink.parentElement?.textContent).not.toMatch(/kB|MB/);
  });

  it("compte les liens de l’onglet dans la pastille", () => {
    // WHEN
    renderResourcesContentWithSearch("");

    // THEN
    expect(
      screen.getByRole("tab", { name: /Actes administratifs\s*2/ })
    ).toBeInTheDocument();
  });

  it("garde le bouton Rechercher visible pendant la saisie", async () => {
    // GIVEN
    renderResourcesContentWithSearch("");

    // WHEN
    await userEvent.type(screen.getByRole("searchbox"), "cpom");

    // THEN
    expect(
      screen.getByRole("button", { name: "Rechercher" })
    ).toBeInTheDocument();
  });

  it("remplit la recherche quand on clique sur une suggestion", async () => {
    // GIVEN
    renderResourcesContentWithSearch("");

    // WHEN
    await userEvent.click(screen.getByRole("button", { name: "CPOM" }));

    // THEN
    expect(screen.getByRole("searchbox")).toHaveValue("CPOM");
  });

  it("ne garde que la FAQ quand la recherche correspond au contenu de la FAQ uniquement", () => {
    // WHEN
    renderResourcesContentWithSearch("pluriannuel");

    // THEN
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.queryByText("Modèles")).not.toBeInTheDocument();
  });

  it("affiche un chargement de la FAQ tant que les items ne sont pas récupérés", () => {
    // GIVEN
    mockedSearchParams.searchParamsValue = new URLSearchParams();
    mockedFaqItems.value = undefined;

    // WHEN
    render(<ResourcesContent blocks={BLOCKS} suggestions={["CPOM", "OFII"]} />);

    // THEN
    expect(screen.getByText("Modèles")).toBeInTheDocument();
    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("masque le bloc FAQ si aucun item n’existe", () => {
    // WHEN
    renderResourcesContentWithSearch("", []);

    // THEN
    expect(screen.getByText("Modèles")).toBeInTheDocument();
    expect(screen.queryByText("FAQ")).not.toBeInTheDocument();
  });

  it("affiche un message d’absence de résultat avec le terme cherché", () => {
    // GIVEN
    mockedSearchParams.searchParamsValue = new URLSearchParams({
      search: "introuvable",
    });
    mockedFaqItems.value = [];

    // WHEN
    render(<ResourcesContent blocks={[]} suggestions={[]} />);

    // THEN
    expect(
      screen.getByText(/Aucun résultat pour « introuvable »/)
    ).toBeInTheDocument();
  });

  it("affiche un message dédié quand aucun contenu n’est publié", () => {
    // GIVEN
    mockedSearchParams.searchParamsValue = new URLSearchParams();
    mockedFaqItems.value = [];

    // WHEN
    render(<ResourcesContent blocks={[]} suggestions={[]} />);

    // THEN
    expect(
      screen.getByText("Aucun contenu publié pour le moment.")
    ).toBeInTheDocument();
  });

  it("propose les recherches suggérées", () => {
    // WHEN
    renderResourcesContentWithSearch("");

    // THEN
    expect(screen.getByRole("button", { name: "CPOM" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OFII" })).toBeInTheDocument();
  });
});
