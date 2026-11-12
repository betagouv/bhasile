import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFaqApiItem } from "tests/test-utils/factories/faq.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FaqManager } from "@/app/(authenticated)/(with-menu)/parametres/cockpit-admin/(fonctionnalites)/faq/_components/FaqManager";
import { FetchStateProvider } from "@/contexts/FetchStateContext";
import { FaqApiType } from "@/schemas/api/faq.schema";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  usePathname: () => "/parametres/cockpit-admin/faq",
}));

const faqItems: FaqApiType[] = [
  createFaqApiItem(),
  createFaqApiItem({
    id: 2,
    question: "Qui contacter ?",
    contentMarkdown: "L’équipe Bhasile.",
    category: "Général",
  }),
];

const renderManager = (items: FaqApiType[] = faqItems) =>
  render(
    <FetchStateProvider>
      <FaqManager faqItems={items} />
    </FetchStateProvider>
  );

const getDialog = (name: string) => screen.getByRole("dialog", { name });

const getCategorySection = (category: string) =>
  screen
    .getByRole("heading", { name: category })
    .closest("section") as HTMLElement;

describe("FaqManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  it("regroupe les questions par catégorie", () => {
    renderManager();

    const structures = getCategorySection("Structures");
    expect(
      within(structures).getByText("Comment déclarer une fermeture ?")
    ).toBeInTheDocument();
    expect(
      within(structures).queryByText("Qui contacter ?")
    ).not.toBeInTheDocument();
  });

  it("signale une FAQ vide", () => {
    renderManager([]);

    expect(
      screen.getByText("La FAQ ne contient aucune question.")
    ).toBeInTheDocument();
  });

  it("crée une question puis rafraîchit la page", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      screen.getByRole("button", { name: "Ajouter une question" })
    );
    const dialog = getDialog("Ajouter une question");
    await user.type(
      within(dialog).getByLabelText("Question"),
      "Où trouver les modèles ?"
    );
    await user.click(within(dialog).getByRole("radio", { name: "Général" }));
    await user.type(
      within(dialog).getByLabelText(/Réponse/),
      "Dans l’onglet Modèles."
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/faq", {
        method: "POST",
        body: JSON.stringify({
          question: "Où trouver les modèles ?",
          contentMarkdown: "Dans l’onglet Modèles.",
          category: "Général",
        }),
      });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("crée une question dans une nouvelle catégorie", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      screen.getByRole("button", { name: "Ajouter une question" })
    );
    const dialog = getDialog("Ajouter une question");
    await user.type(
      within(dialog).getByRole("textbox", { name: "Nouvelle catégorie" }),
      "Tarification"
    );
    expect(
      within(dialog).getByRole("radio", { name: "Nouvelle catégorie" })
    ).toBeChecked();
    await user.type(
      within(dialog).getByLabelText("Question"),
      "Quand ouvre la campagne ?"
    );
    await user.type(within(dialog).getByLabelText(/Réponse/), "En janvier.");
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/faq",
        expect.objectContaining({
          body: JSON.stringify({
            question: "Quand ouvre la campagne ?",
            contentMarkdown: "En janvier.",
            category: "Tarification",
          }),
        })
      );
    });
  });

  it("retient la catégorie existante choisie après une saisie de nouvelle catégorie", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      screen.getByRole("button", { name: "Ajouter une question" })
    );
    const dialog = getDialog("Ajouter une question");
    await user.type(
      within(dialog).getByRole("textbox", { name: "Nouvelle catégorie" }),
      "Tarif"
    );
    await user.click(within(dialog).getByRole("radio", { name: "Général" }));
    await user.type(within(dialog).getByLabelText("Question"), "Une question");
    await user.type(within(dialog).getByLabelText(/Réponse/), "Une réponse");
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/faq",
        expect.objectContaining({
          body: JSON.stringify({
            question: "Une question",
            contentMarkdown: "Une réponse",
            category: "Général",
          }),
        })
      );
    });
  });

  it("rouvre l'ajout sans erreur après une première création", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      screen.getByRole("button", { name: "Ajouter une question" })
    );
    const dialog = getDialog("Ajouter une question");
    await user.click(within(dialog).getByRole("radio", { name: "Général" }));
    await user.type(within(dialog).getByLabelText("Question"), "Une question");
    await user.type(within(dialog).getByLabelText(/Réponse/), "Une réponse");
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" })
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    await user.click(
      screen.getByRole("button", { name: "Ajouter une question" })
    );
    await user.click(
      within(dialog).getByRole("radio", { name: "Nouvelle catégorie" })
    );

    expect(within(dialog).getByLabelText("Question")).toHaveValue("");
    expect(
      within(dialog).queryByText("La catégorie est requise")
    ).not.toBeInTheDocument();
  });

  it("propose les catégories existantes et coche celle de la question modifiée", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      within(getCategorySection("Structures")).getByRole("button", {
        name: "Modifier",
      })
    );
    const dialog = getDialog("Modifier la question");

    expect(
      within(dialog).getByRole("radio", { name: "Structures" })
    ).toBeChecked();
    expect(
      within(dialog).getByRole("radio", { name: "Général" })
    ).not.toBeChecked();
  });

  it("n'enregistre pas une question incomplète", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      screen.getByRole("button", { name: "Ajouter une question" })
    );
    const dialog = getDialog("Ajouter une question");
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" })
    );

    expect(
      await within(dialog).findByText("La question est requise")
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("modifie une question à partir de ses valeurs actuelles", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      within(getCategorySection("Structures")).getByRole("button", {
        name: "Modifier",
      })
    );
    const dialog = getDialog("Modifier la question");
    const question = within(dialog).getByLabelText("Question");
    expect(question).toHaveValue("Comment déclarer une fermeture ?");

    await user.clear(question);
    await user.type(question, "Comment fermer une structure ?");
    await user.click(
      within(dialog).getByRole("button", { name: "Enregistrer" })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/faq/1", {
        method: "PUT",
        body: JSON.stringify({
          question: "Comment fermer une structure ?",
          contentMarkdown: "Depuis la fiche structure.",
          category: "Structures",
        }),
      });
    });
  });

  it("supprime une question après confirmation", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      within(getCategorySection("Structures")).getByRole("button", {
        name: "Supprimer",
      })
    );
    const dialog = getDialog("Supprimer la question");
    await user.click(within(dialog).getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/faq/1", {
        method: "DELETE",
      });
    });
  });

  it("renomme une catégorie à partir de son nom actuel", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      within(getCategorySection("Structures")).getByRole("button", {
        name: "Renommer",
      })
    );
    const dialog = getDialog("Renommer la catégorie");
    const name = within(dialog).getByLabelText(/Nom de la catégorie/);
    expect(name).toHaveValue("Structures");

    await user.clear(name);
    await user.type(name, "Fiches structures");
    await user.click(within(dialog).getByRole("button", { name: "Renommer" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/faq/categories", {
        method: "PUT",
        body: JSON.stringify({
          category: "Structures",
          newCategory: "Fiches structures",
        }),
      });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("refuse de renommer une catégorie avec un nom vide", async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(
      within(getCategorySection("Structures")).getByRole("button", {
        name: "Renommer",
      })
    );
    const dialog = getDialog("Renommer la catégorie");
    await user.clear(within(dialog).getByLabelText(/Nom de la catégorie/));
    await user.click(within(dialog).getByRole("button", { name: "Renommer" }));

    expect(
      await within(dialog).findByText("La catégorie est requise")
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
