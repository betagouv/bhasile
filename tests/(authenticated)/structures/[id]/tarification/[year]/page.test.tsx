import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TarificationPage from "@/app/(authenticated)/structures/[id]/tarification/[year]/page";
import { DomainError } from "@/app/utils/domain-error.util";

const mockGetServerSession = vi.fn();
const mockGetTarificationOverview = vi.fn();
const mockEchanges = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2026,
  };
});

vi.mock("@/app/api/tarifications/tarification.service", () => ({
  getTarificationOverview: (...args: unknown[]) =>
    mockGetTarificationOverview(...args),
}));

vi.mock(
  "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/Echanges",
  () => ({
    Echanges: (props: Record<string, unknown>) => {
      mockEchanges(props);
      return <div data-testid="echanges" />;
    },
  })
);

vi.mock(
  "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/TarificationHeader",
  () => ({
    TarificationHeader: () => <div data-testid="tarification-header" />,
  })
);

const overview = {
  codeBhasile: "BHA-42",
  participant: { id: 3, level: "DEPARTEMENT", isSuperAdmin: false },
  isOperateur: false,
  campaignYears: [2027, 2026, 2024],
};

const renderPage = async (id: string, year: string) =>
  render(await TarificationPage({ params: Promise.resolve({ id, year }) }));

describe("TarificationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "agent@test.fr" },
    });
    mockGetTarificationOverview.mockResolvedValue(overview);
  });

  it("affiche les échanges d'une campagne ouverte, en écriture", async () => {
    await renderPage("42", "2026");

    expect(screen.getByTestId("echanges")).toBeInTheDocument();
    expect(mockEchanges).toHaveBeenCalledWith(
      expect.objectContaining({
        structureId: 42,
        year: 2026,
        currentUserId: 3,
        isCampaignOpen: true,
      })
    );
  });

  it("affiche une campagne passée qui a des échanges, en lecture seule", async () => {
    await renderPage("42", "2024");

    expect(mockEchanges).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2024, isCampaignOpen: false })
    );
  });

  it("renvoie introuvable pour une année hors de la liste des campagnes", async () => {
    await expect(renderPage("42", "2031")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renvoie introuvable pour des paramètres invalides", async () => {
    await expect(renderPage("abc", "2026")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockGetTarificationOverview).not.toHaveBeenCalled();
  });

  it("renvoie introuvable quand l'accès à la tarification est refusé", async () => {
    mockGetTarificationOverview.mockRejectedValue(
      new DomainError("Accès refusé à la tarification de la structure", 403)
    );

    await expect(renderPage("42", "2026")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("laisse remonter une erreur inattendue", async () => {
    mockGetTarificationOverview.mockRejectedValue(
      new Error("base injoignable")
    );

    await expect(renderPage("42", "2026")).rejects.toThrow("base injoignable");
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});
