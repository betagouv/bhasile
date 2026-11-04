import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DocumentPanel } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/DocumentPanel";
import type { SectionVersion } from "@/lib/tarification/tarification.section";

const buildVersion = (
  id: number,
  overrides: Partial<SectionVersion> = {}
): SectionVersion => ({
  id,
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
  reviewRequestText: null,
  ...overrides,
});

const renderPanel = (
  versions: SectionVersion[],
  { isOperateur = false, reviewerNames = [] as string[] } = {}
) =>
  render(
    <DocumentPanel
      label="L48"
      versions={versions}
      isOperateur={isOperateur}
      timeZone="Europe/Paris"
      reviewerNames={reviewerNames}
    />
  );

describe("DocumentPanel", () => {
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
