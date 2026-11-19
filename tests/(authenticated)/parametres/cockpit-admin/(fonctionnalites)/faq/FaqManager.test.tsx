import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
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
  createFaqApiItem({ id: 2, question: "Qui contacter ?", category: "Général" }),
];

const renderManager = (items: FaqApiType[] = faqItems) =>
  render(
    <FetchStateProvider>
      <FaqManager faqItems={items} />
    </FetchStateProvider>
  );

const openAddDialog = async (user: UserEvent): Promise<HTMLElement> => {
  await user.click(
    screen.getByRole("button", { name: "Ajouter une question" })
  );
  return screen.getByRole("dialog", { name: "Ajouter une question" });
};

const openFromCategory = async (
  user: UserEvent,
  action: string,
  dialogName: string
): Promise<HTMLElement> => {
  const section = screen
    .getByRole("heading", { name: "Structures" })
    .closest("section") as HTMLElement;
  await user.click(within(section).getByRole("button", { name: action }));
  return screen.getByRole("dialog", { name: dialogName });
};

const fillQuestion = async (
  user: UserEvent,
  dialog: HTMLElement
): Promise<void> => {
  await user.type(within(dialog).getByLabelText("Question"), "Une question");
  await user.type(within(dialog).getByLabelText(/Réponse/), "Une réponse");
};

const click = (user: UserEvent, dialog: HTMLElement, name: string) =>
  user.click(within(dialog).getByRole("button", { name }));

const expectRequest = (url: string, method: string, body?: object) =>
  waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(url, {
      method,
      body: body && JSON.stringify(body),
    })
  );

describe("FaqManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  it("signale une FAQ vide", () => {
    renderManager([]);

    expect(
      screen.getByText("La FAQ ne contient aucune question.")
    ).toBeInTheDocument();
  });

  it("crée une question dans la catégorie cochée en dernier, puis rafraîchit la page", async () => {
    const user = userEvent.setup();
    renderManager();

    const dialog = await openAddDialog(user);
    await user.type(
      within(dialog).getByRole("textbox", { name: "Nouvelle catégorie" }),
      "Tarif"
    );
    await user.click(within(dialog).getByRole("radio", { name: "Général" }));
    await fillQuestion(user, dialog);
    await click(user, dialog, "Enregistrer");

    await expectRequest("/api/faq", "POST", {
      question: "Une question",
      contentMarkdown: "Une réponse",
      category: "Général",
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("crée une question dans une nouvelle catégorie saisie sur place", async () => {
    const user = userEvent.setup();
    renderManager();

    const dialog = await openAddDialog(user);
    await user.type(
      within(dialog).getByRole("textbox", { name: "Nouvelle catégorie" }),
      "Tarification"
    );
    expect(
      within(dialog).getByRole("radio", { name: "Nouvelle catégorie" })
    ).toBeChecked();
    await fillQuestion(user, dialog);
    await click(user, dialog, "Enregistrer");

    await expectRequest("/api/faq", "POST", {
      question: "Une question",
      contentMarkdown: "Une réponse",
      category: "Tarification",
    });
  });

  it("n'enregistre pas une question incomplète", async () => {
    const user = userEvent.setup();
    renderManager();

    const dialog = await openAddDialog(user);
    await click(user, dialog, "Enregistrer");

    expect(
      await within(dialog).findByText("La question est requise")
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rouvre l'ajout vierge et sans erreur après une création", async () => {
    const user = userEvent.setup();
    renderManager();

    const dialog = await openAddDialog(user);
    await user.click(within(dialog).getByRole("radio", { name: "Général" }));
    await fillQuestion(user, dialog);
    await click(user, dialog, "Enregistrer");
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    await openAddDialog(user);
    await user.click(
      within(dialog).getByRole("radio", { name: "Nouvelle catégorie" })
    );

    expect(within(dialog).getByLabelText("Question")).toHaveValue("");
    expect(
      within(dialog).queryByText("La catégorie est requise")
    ).not.toBeInTheDocument();
  });

  it("modifie une question à partir de ses valeurs actuelles", async () => {
    const user = userEvent.setup();
    renderManager();

    const dialog = await openFromCategory(
      user,
      "Modifier",
      "Modifier la question"
    );
    const question = within(dialog).getByLabelText("Question");
    expect(question).toHaveValue("Comment déclarer une fermeture ?");
    expect(
      within(dialog).getByRole("radio", { name: "Structures" })
    ).toBeChecked();

    await user.clear(question);
    await user.type(question, "Comment fermer une structure ?");
    await click(user, dialog, "Enregistrer");

    await expectRequest("/api/faq/1", "PUT", {
      question: "Comment fermer une structure ?",
      contentMarkdown: "Depuis la fiche structure.",
      category: "Structures",
    });
  });

  it("supprime une question après confirmation", async () => {
    const user = userEvent.setup();
    renderManager();

    const dialog = await openFromCategory(
      user,
      "Supprimer",
      "Supprimer la question"
    );
    await click(user, dialog, "Supprimer");

    await expectRequest("/api/faq/1", "DELETE");
  });

  it("renomme une catégorie à partir de son nom actuel", async () => {
    const user = userEvent.setup();
    renderManager();

    const dialog = await openFromCategory(
      user,
      "Renommer",
      "Renommer la catégorie"
    );
    const name = within(dialog).getByLabelText(/Nom de la catégorie/);
    expect(name).toHaveValue("Structures");

    await user.clear(name);
    await user.type(name, "Fiches structures");
    await click(user, dialog, "Renommer");

    await expectRequest("/api/faq/categories", "PUT", {
      category: "Structures",
      newCategory: "Fiches structures",
    });
  });
});
