import { screen } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import { createActualisationForm } from "tests/test-utils/factories/actualisation-form.factory";
import { createStructure } from "tests/test-utils/structure.factory";
import { renderWithStructurePageProviders } from "tests/test-utils/structure-page-test.helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StructureHeader } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_header/StructureHeader";
import { AppAbilityProvider } from "@/contexts/AbilityProvider";
import { StructureApiRead } from "@/schemas/api/structure.schema";

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/structures/42",
}));

const ACTUALISATION_YEAR = 2026;

const buildStructure = (
  overrides: Partial<StructureApiRead> = {}
): StructureApiRead => ({
  ...createStructure({ id: 42 }),
  ...overrides,
});

const buildClosedStructure = (
  overrides: Partial<StructureApiRead> = {}
): StructureApiRead =>
  buildStructure({
    isClosed: true,
    fermetureDate: "2025-11-17",
    ...overrides,
  });

describe("StructureHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    vi.stubEnv("NEXT_PUBLIC_SHOW_TRANSFORMATION", "true");
    global.fetch = vi.fn();
  });

  it("ramène à la liste des structures par défaut", () => {
    renderWithStructurePageProviders(
      buildClosedStructure(),
      <StructureHeader
        actualisationYear={null}
        isTarificationAccessible={false}
      />
    );

    expect(screen.getByRole("link", { name: "Retour" })).toHaveAttribute(
      "href",
      "/structures"
    );
  });

  it("ramène au tableau de bord quand on en vient", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("from=dashboard"));

    renderWithStructurePageProviders(
      buildClosedStructure(),
      <StructureHeader
        actualisationYear={null}
        isTarificationAccessible={false}
      />
    );

    expect(screen.getByRole("link", { name: "Retour" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("affiche la date de fermeture et masque le menu pour une structure fermée", () => {
    // GIVEN
    const structure = buildClosedStructure({ isFinalised: false });

    // WHEN
    renderWithStructurePageProviders(
      structure,
      <StructureHeader
        actualisationYear={null}
        isTarificationAccessible={false}
      />
    );

    // THEN
    expect(screen.getByText(/Fermée le/)).toBeInTheDocument();
    expect(screen.getByText("17/11/2025")).toBeInTheDocument();
    expect(screen.queryByText(/finalise la création/)).not.toBeInTheDocument();
    expect(screen.queryByTitle("Menu structure")).not.toBeInTheDocument();
  });

  it("propose la finalisation et le menu pour une structure ouverte", () => {
    // GIVEN
    const structure = buildStructure({ isFinalised: false });

    // WHEN
    renderWithStructurePageProviders(
      structure,
      <SessionProvider>
        <AppAbilityProvider>
          <StructureHeader
            actualisationYear={null}
            isTarificationAccessible={false}
          />
        </AppAbilityProvider>
      </SessionProvider>
    );

    // THEN
    expect(screen.getByText(/finalise la création/)).toBeInTheDocument();
    expect(screen.getByTitle("Menu structure")).toBeInTheDocument();
    expect(screen.queryByText(/Fermée le/)).not.toBeInTheDocument();
  });

  it("propose l’actualisation pour une structure ouverte dont la campagne est en cours", () => {
    // GIVEN
    const structure = buildStructure({
      isFinalised: true,
      forms: [createActualisationForm(ACTUALISATION_YEAR)],
    });

    // WHEN
    renderWithStructurePageProviders(
      structure,
      <SessionProvider>
        <AppAbilityProvider>
          <StructureHeader
            actualisationYear={ACTUALISATION_YEAR}
            isTarificationAccessible={false}
          />
        </AppAbilityProvider>
      </SessionProvider>
    );

    // THEN
    expect(screen.getByText(/campagne d’actualisation/)).toBeInTheDocument();
  });

  it("masque l’actualisation pour une structure fermée dont la campagne est en cours", () => {
    // GIVEN
    const structure = buildClosedStructure({
      isFinalised: true,
      forms: [createActualisationForm(ACTUALISATION_YEAR)],
    });

    // WHEN
    renderWithStructurePageProviders(
      structure,
      <StructureHeader
        actualisationYear={ACTUALISATION_YEAR}
        isTarificationAccessible={false}
      />
    );

    // THEN
    expect(
      screen.queryByText(/campagne d’actualisation/)
    ).not.toBeInTheDocument();
  });

  it("affiche le lien vers la tarification quand elle est accessible", () => {
    renderWithStructurePageProviders(
      buildStructure(),
      <SessionProvider>
        <AppAbilityProvider>
          <StructureHeader actualisationYear={null} isTarificationAccessible />
        </AppAbilityProvider>
      </SessionProvider>
    );

    expect(screen.getByRole("link", { name: "Tarification" })).toHaveAttribute(
      "href",
      "/structures/42/tarification"
    );
  });

  it("masque le lien vers la tarification sinon", () => {
    renderWithStructurePageProviders(
      buildStructure(),
      <SessionProvider>
        <AppAbilityProvider>
          <StructureHeader
            actualisationYear={null}
            isTarificationAccessible={false}
          />
        </AppAbilityProvider>
      </SessionProvider>
    );

    expect(
      screen.queryByRole("link", { name: "Tarification" })
    ).not.toBeInTheDocument();
  });

  it("garde le lien vers la tarification sur une structure fermée", () => {
    renderWithStructurePageProviders(
      buildClosedStructure(),
      <StructureHeader actualisationYear={null} isTarificationAccessible />
    );

    expect(screen.getByText(/Fermée le/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tarification" })).toHaveAttribute(
      "href",
      "/structures/42/tarification"
    );
  });
});
