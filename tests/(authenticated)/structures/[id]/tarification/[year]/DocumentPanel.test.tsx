import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentPanel } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/DocumentPanel";
import type { SectionActions } from "@/lib/tarification/tarification.actions";
import type { SectionVersion } from "@/lib/tarification/tarification.section";

const mockFetch = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@codegouvfr/react-dsfr/Modal", () => ({
  createModal: () => ({
    open: vi.fn(),
    close: vi.fn(),
    Component: () => null,
  }),
}));

const NO_ACTIONS = {
  depositOptions: [],
  canMarkNotApplicable: false,
  canRespondToL48: false,
  versionActions: {},
};

const buildVersion = (
  id: number,
  overrides: Partial<SectionVersion> = {}
): SectionVersion => ({
  id,
  types: ["L48"],
  file: {
    key: `v${id}.pdf`,
    originalName: `v${id}.pdf`,
    mimeType: "application/pdf",
    fileSize: 2048,
    sha256: null,
  },
  typesLabel: "L48 2028",
  stateLabel: "Créé",
  date: new Date("2028-04-10T10:00:00Z"),
  authorName: "Alice",
  isShared: false,
  isWithdrawn: false,
  withdrawalReason: null,
  changesRequests: [],
  ...overrides,
});

const renderPanel = (
  versions: SectionVersion[],
  {
    isOperateur = false,
    reviewerNames = [] as string[],
    actions = NO_ACTIONS as SectionActions,
  } = {}
) =>
  render(
    <DocumentPanel
      structureId={42}
      year={2028}
      sectionCode="L48"
      actions={actions}
      hasSharedL48={false}
      contradictoireDeadline={null}
      label="L48"
      versions={versions}
      isOperateur={isOperateur}
      timeZone="Europe/Paris"
      reviewerNames={reviewerNames}
    />
  );

describe("DocumentPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it("revient sur la dernière version après un dépôt, relu depuis le serveur", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ key: "depot.pdf" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 3 }), { status: 201 })
      );
    renderPanel([buildVersion(1)], {
      actions: {
        ...NO_ACTIONS,
        depositOptions: [
          { type: "L48", label: "L48 2028", statuses: ["FINAL", "DRAFT"] },
        ],
      },
    });

    await userEvent.upload(
      screen.getByLabelText("Fichier à déposer"),
      new File(["contenu"], "depot.pdf", { type: "application/pdf" })
    );

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/tarifications/42/2028/documents",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          fileKey: "depot.pdf",
          types: ["L48"],
          status: "DRAFT",
        }),
      })
    );
  });

  it("affiche la dernière version non retirée, au fuseau de la structure", () => {
    renderPanel([
      buildVersion(2, {
        isWithdrawn: true,
        stateLabel: "Retiré",
        file: { ...buildVersion(2).file, originalName: "retire.pdf" },
      }),
      buildVersion(1, { stateLabel: "Signé" }),
    ]);

    expect(screen.getByText("Signé")).toBeInTheDocument();
    expect(screen.getByText(/le 10\/04\/2028 par Alice/)).toBeInTheDocument();
    expect(screen.getByText("v1.pdf")).toBeInTheDocument();
  });

  it("garde l'historique replié, et affiche la version choisie dans la visionneuse", async () => {
    renderPanel([
      buildVersion(2, { stateLabel: "Signé" }),
      buildVersion(1, { stateLabel: "Validé" }),
    ]);

    expect(screen.queryByText("Validé")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", {
        name: "Voir l’historique des modifications",
      })
    );
    await userEvent.click(screen.getByRole("button", { name: /Validé/ }));

    expect(screen.getByRole("button", { name: /Validé/ })).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(
      screen.getByRole("button", { name: "Ouvrir le document" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("v1.pdf").length).toBeGreaterThan(0);
  });

  it("empêche l'opérateur d'ouvrir un document retiré, pas l'agent", () => {
    const withdrawn = buildVersion(1, {
      isWithdrawn: true,
      stateLabel: "Retiré",
      withdrawalReason: "Erreur de structure",
    });

    const { unmount } = renderPanel([withdrawn], { isOperateur: true });
    expect(screen.getByText(/a été retiré/)).toBeInTheDocument();
    expect(
      screen.getByText(/Motif du retrait : Erreur de structure/)
    ).toBeInTheDocument();
    unmount();

    renderPanel([withdrawn]);
    expect(
      screen.getByRole("button", { name: "Ouvrir le document" })
    ).toBeInTheDocument();
  });

  it("dit à l'opérateur qu'un document n'a pas encore été envoyé", () => {
    renderPanel([], { isOperateur: true });

    expect(screen.getByText(/pas encore été envoyé/)).toBeInTheDocument();
  });

  it("liste les relecteurs", () => {
    renderPanel([buildVersion(1)], { reviewerNames: ["Marie", "Hakim"] });

    expect(screen.getByText("Marie, Hakim")).toBeInTheDocument();
  });
});
