import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TarificationSidebar } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/TarificationSidebar";
import type { StepProgress } from "@/lib/tarification/tarification.section";

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => mockUseSearchParams(),
}));

const progress: StepProgress = {
  creators: [{ name: "Alice", level: "DEPARTEMENT" }],
  reviewers: [
    { name: "Marie", level: "REGION" },
    { name: "Hakim", level: "REGION" },
  ],
  hasChangesRequested: false,
  isValidated: true,
  isSigned: false,
  isSent: false,
  isReceived: false,
  createdAt: new Date("2028-05-12T13:05:00Z"),
  validatedAt: new Date("2028-05-13T08:30:00Z"),
  signedAt: null,
  sentAt: null,
  receivedAt: null,
};

const renderSidebar = ({
  isOperateur = false,
  selectedCode = "L48",
  isCaLate = true,
} = {}) =>
  render(
    <TarificationSidebar
      structureId={42}
      year={2028}
      campaignYears={[2029, 2028]}
      selectedCode={selectedCode as "L48"}
      isOperateur={isOperateur}
      drlUrl="https://www.legifrance.gouv.fr/drl"
      timeZone="Europe/Paris"
      preliminarySections={[
        { code: "CA", label: "CA 2026", isLate: isCaLate },
        { code: "BP", label: "BP 2028", isLate: false },
      ]}
      steps={[
        {
          code: "RCA",
          label: "RCA",
          status: "DONE",
          isLate: false,
          deadline: null,
          progress,
        },
        {
          code: "L48",
          label: "L48",
          subtitle: "Procédure Contradictoire",
          status: "EXPECTED",
          isLate: true,
          deadline: "2028-05-20",
          progress,
        },
      ]}
    />
  );

describe("TarificationSidebar", () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("canal=agents"));
  });

  it("met l'étape dans l'URL, sans perdre le canal", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "RCA" })).toHaveAttribute(
      "href",
      "?canal=agents&etape=RCA"
    );
  });

  it("ouvre la DRL sur Légifrance", () => {
    renderSidebar();

    expect(
      screen.getByRole("link", { name: "Dotation Régionale Limitative 2028" })
    ).toHaveAttribute("href", "https://www.legifrance.gouv.fr/drl");
  });

  it("signale les retards", () => {
    renderSidebar();

    expect(screen.getAllByText("En retard")).toHaveLength(2);
  });

  it("replie les documents préparatoires, sauf pour un retard ou le document sélectionné", () => {
    renderSidebar({ isCaLate: false });
    const toggle = screen.getByRole("button", {
      name: "Documents préparatoires",
    });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: "CA 2026" })
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(screen.getByRole("link", { name: "CA 2026" })).toBeInTheDocument();
  });

  it("garde ouverts les documents préparatoires quand l'un est sélectionné", () => {
    renderSidebar({ isCaLate: false, selectedCode: "CA" });

    expect(screen.getByRole("link", { name: "CA 2026" })).toBeInTheDocument();
  });

  it("montre à un agent les sous-états de l'étape sélectionnée, datés, et qui les a faits", () => {
    renderSidebar();

    const step = screen.getByRole("link", { name: /L48/ }).closest("li")!;
    expect(step).toHaveTextContent("créé le 12/05 à 15h05");
    expect(step).toHaveTextContent("validé le 13/05 à 10h30");
    expect(within(step).getByText("à signer")).toBeInTheDocument();
    expect(step).toHaveTextContent("à envoyer avant le 20/05");
    expect(within(step).getByText("à recevoir")).toBeInTheDocument();
    expect(within(step).getByTitle("Marie, Hakim")).toBeInTheDocument();
    expect(within(step).getByText("DREETS")).toBeInTheDocument();
  });

  it("affiche le sous-titre de l'étape", () => {
    renderSidebar();

    expect(
      screen.getByRole("link", { name: /Procédure Contradictoire/ })
    ).toBeInTheDocument();
  });

  it("ne montre à l'opérateur qu'envoyé et reçu", () => {
    renderSidebar({ isOperateur: true });

    const step = screen.getByRole("link", { name: /L48/ }).closest("li")!;
    expect(step).toHaveTextContent("à envoyer");
    expect(within(step).getByText("à recevoir")).toBeInTheDocument();
    for (const label of [/créé/, /valid/, /signer/]) {
      expect(within(step).queryByText(label)).not.toBeInTheDocument();
    }
    expect(within(step).queryByTitle("Marie, Hakim")).not.toBeInTheDocument();
  });
});
