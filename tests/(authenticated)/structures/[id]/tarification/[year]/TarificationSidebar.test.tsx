import { render, screen, within } from "@testing-library/react";
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
};

const renderSidebar = ({ isOperateur = false, selectedCode = "L48" } = {}) =>
  render(
    <TarificationSidebar
      structureId={42}
      year={2028}
      campaignYears={[2029, 2028]}
      selectedCode={selectedCode as "L48"}
      isOperateur={isOperateur}
      drlUrl="https://www.legifrance.gouv.fr/drl"
      preliminarySections={[
        { code: "CA", label: "CA 2026", isLate: true },
        { code: "BP", label: "BP 2028", isLate: false },
      ]}
      steps={[
        { code: "RCA", label: "RCA", status: "DONE", isLate: false, progress },
        {
          code: "L48",
          label: "L48",
          status: "EXPECTED",
          isLate: true,
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

  it("montre à un agent les six sous-états de l'étape sélectionnée, et qui a relu", () => {
    renderSidebar();

    const step = screen.getByRole("link", { name: /L48/ }).closest("li")!;
    for (const label of ["créé", "relu", "validé", "signé", "envoyé", "reçu"]) {
      expect(within(step).getByText(label)).toBeInTheDocument();
    }
    expect(within(step).getByText("par 2 personnes")).toHaveAttribute(
      "title",
      "Marie, Hakim"
    );
    expect(within(step).getByText("DREETS")).toBeInTheDocument();
  });

  it("ne montre à l'opérateur qu'envoyé et reçu", () => {
    renderSidebar({ isOperateur: true });

    const step = screen.getByRole("link", { name: /L48/ }).closest("li")!;
    expect(within(step).getByText("envoyé")).toBeInTheDocument();
    expect(within(step).getByText("reçu")).toBeInTheDocument();
    for (const label of ["créé", "relu", "validé", "signé"]) {
      expect(within(step).queryByText(label)).not.toBeInTheDocument();
    }
    expect(within(step).queryByText(/personne/)).not.toBeInTheDocument();
  });
});
