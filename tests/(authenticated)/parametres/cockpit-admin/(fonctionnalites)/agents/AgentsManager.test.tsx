import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createAgentRead,
  createPerimeterRead,
} from "tests/test-utils/factories/agent.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AgentsManager } from "@/app/(authenticated)/(with-menu)/parametres/cockpit-admin/(fonctionnalites)/agents/_components/AgentsManager";
import { FetchStateProvider } from "@/contexts/FetchStateContext";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/parametres/cockpit-admin/agents",
}));

const finistere = createPerimeterRead();
const pending = createAgentRead();
const active = createAgentRead({
  id: 13,
  email: "actif@morbihan.gouv.fr",
  name: "Paul Actif",
  status: "ACTIVATED",
  perimeter: { id: 3, name: "DDETS Finistère" },
});

const morbihan = createPerimeterRead({
  id: 7,
  name: "DDETS Morbihan",
  zoneKey: "DEPARTEMENT:56",
  zoneLabel: "56 – Morbihan",
});

const renderManager = (perimeters = [finistere]) => (
  <FetchStateProvider>
    <AgentsManager
      agents={[pending, active]}
      perimeters={perimeters}
      zones={[
        { scope: "DEPARTEMENT", id: "29", name: "Finistère" },
        { scope: "DEPARTEMENT", id: "56", name: "Morbihan" },
      ]}
    />
  </FetchStateProvider>
);

const expectRequest = async (
  url: string,
  method: string,
  body: unknown
): Promise<void> => {
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ method })
    )
  );
  expect(
    JSON.parse(vi.mocked(global.fetch).mock.lastCall![1]!.body as string)
  ).toEqual(body);
};

describe("AgentsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: morbihan.id }),
    });
  });

  it("affiche les comptes en attente par défaut et filtre par la recherche", async () => {
    const user = userEvent.setup();
    render(renderManager());

    expect(screen.getByText(pending.email)).toBeInTheDocument();
    expect(screen.queryByText(active.email)).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Rechercher par email ou nom"),
      "paul"
    );
    expect(screen.getByLabelText("En attente (0)")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Actif (1)"));

    expect(screen.getByText(active.email)).toBeInTheDocument();
  });

  it("valide un agent en attente dans le périmètre choisi", async () => {
    const user = userEvent.setup();
    render(renderManager());

    await user.click(screen.getByRole("button", { name: "Valider" }));
    const dialog = screen.getByRole("dialog", { name: "Valider l’agent" });
    expect(
      within(dialog).getByRole("button", { name: "Valider" })
    ).toBeDisabled();
    await user.selectOptions(within(dialog).getByLabelText("Périmètre"), "3");
    await user.click(within(dialog).getByRole("button", { name: "Valider" }));

    await expectRequest("/api/agents/12", "PUT", {
      status: "ACTIVATED",
      perimeterId: 3,
    });
  });

  it("désactive un agent actif après confirmation", async () => {
    const user = userEvent.setup();
    render(renderManager());

    await user.click(screen.getByLabelText("Actif (1)"));
    await user.click(screen.getByRole("button", { name: "Désactiver" }));
    const dialog = screen.getByRole("dialog", { name: "Désactiver l’agent" });
    await user.click(
      within(dialog).getByRole("button", { name: "Désactiver" })
    );

    await expectRequest("/api/agents/13", "PUT", { status: "DEACTIVATED" });
  });

  it("signale les périmètres existants sur la zone et pré-remplit le nom", async () => {
    const user = userEvent.setup();
    render(renderManager());

    await user.click(
      screen.getByRole("button", { name: "Créer un périmètre" })
    );
    const dialog = screen.getByRole("dialog", { name: "Créer un périmètre" });
    await user.selectOptions(
      within(dialog).getByLabelText("Département"),
      "29"
    );

    expect(
      within(dialog).getByText(
        /1 périmètre existe déjà sur cette zone : DDETS Finistère/
      )
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Nom du périmètre/)).toHaveValue(
      "DDETS Finistère"
    );

    await user.type(
      within(dialog).getByLabelText(/Nom du périmètre/),
      " – SIAO"
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Créer le périmètre" })
    );

    await expectRequest("/api/perimeters", "POST", {
      scope: "DEPARTEMENT",
      departementNumero: "29",
      name: "DDETS Finistère – SIAO",
    });
  });

  it("crée un périmètre depuis la validation puis y revient avec ce périmètre choisi", async () => {
    const user = userEvent.setup();
    const { rerender } = render(renderManager());

    await user.click(screen.getByRole("button", { name: "Valider" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Valider l’agent" })).getByRole(
        "button",
        { name: "Créer un périmètre" }
      )
    );
    const perimeterDialog = screen.getByRole("dialog", {
      name: "Créer un périmètre",
    });
    await user.selectOptions(
      within(perimeterDialog).getByLabelText("Département"),
      "56"
    );
    await user.click(
      within(perimeterDialog).getByRole("button", {
        name: "Créer le périmètre",
      })
    );
    rerender(renderManager([finistere, morbihan]));

    const accessDialog = await screen.findByRole("dialog", {
      name: "Valider l’agent",
    });
    expect(within(accessDialog).getByLabelText("Périmètre")).toHaveValue("7");
  });
});
