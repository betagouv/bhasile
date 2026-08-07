import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { anomalieJustificationModal } from "@/app/(authenticated)/(with-menu)/_components/AnomalieJustificationModal";
import { AnomaliesGroups } from "@/app/(authenticated)/(with-menu)/_components/AnomaliesGroups";
import { FetchStateProvider } from "@/contexts/FetchStateContext";
import { AnomalieGroupNode, DashboardAnomalie } from "@/types/dashboard.type";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  usePathname: () => "/",
}));

const makeAnomalie = (
  overrides: Partial<DashboardAnomalie> = {}
): DashboardAnomalie => ({
  id: 7,
  code: "RESULTAT_NET_EQ_0",
  label: "Le résultat net est égal à zéro",
  year: 2025,
  isJustified: null,
  commentaire: null,
  actionUrl: "/structures/42/modification/finances",
  structureId: 42,
  structureCodeBhasile: "BHA-NOR-024",
  structureType: null,
  structureCommune: "Avranches",
  structureDepartement: "50",
  operateurName: "Adoma",
  ...overrides,
});

const makeNode = (anomalie: DashboardAnomalie): AnomalieGroupNode => ({
  key: "structure-42",
  activeCount: anomalie.isJustified === true ? 0 : 1,
  anomalies: [anomalie],
});

const renderGroups = (anomalie: DashboardAnomalie) =>
  render(
    <FetchStateProvider>
      <AnomaliesGroups nodes={[makeNode(anomalie)]} groupBy="STRUCTURE" />
    </FetchStateProvider>
  );

describe("AnomaliesGroups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  it("envoie la justification saisie puis rafraîchit le tableau de bord", async () => {
    const user = userEvent.setup();
    renderGroups(makeAnomalie());

    const openModal = vi.spyOn(anomalieJustificationModal, "open");

    await user.click(screen.getByRole("button", { name: /BHA-NOR-024/ }));
    await user.click(
      screen.getByRole("button", { name: "Ignorer et justifier" })
    );

    expect(openModal).toHaveBeenCalled();

    // Le <dialog> DSFR n'est ouvert que par le runtime dsfr, absent de jsdom.
    await user.type(
      screen.getByRole("textbox", { hidden: true }),
      "Exercice contrôlé"
    );
    await user.click(
      screen.getByRole("button", { name: "Valider", hidden: true })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/anomalies/7", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isJustified: true,
          commentaire: "Exercice contrôlé",
        }),
      });
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("rouvre une anomalie ignorée sans passer par la pop-in", async () => {
    const user = userEvent.setup();
    renderGroups(makeAnomalie({ isJustified: true, commentaire: "Vérifié" }));

    await user.click(screen.getByRole("button", { name: /BHA-NOR-024/ }));
    expect(screen.getByText("Vérifié")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Redéclarer l’anomalie" })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/anomalies/7",
        expect.objectContaining({
          body: JSON.stringify({ isJustified: false, commentaire: null }),
        })
      );
    });
  });
});
