import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Filters } from "@/app/components/filters/Filters";

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

describe("Filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("affiche l'indicateur actif quand des filtres sont appliqués", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("type=CADA&bati=DIFFUS")
    );

    render(<Filters />);

    const filterButton = screen.getByRole("button", { name: "Filtres actifs" });
    expect(filterButton).toHaveAttribute("aria-pressed", "true");
    expect(filterButton).toHaveAttribute("aria-label", "Filtres actifs");
  });

  it("affiche l'indicateur actif quand le filtre sur les places est appliqué", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("places=10"));

    render(<Filters />);

    const filterButton = screen.getByRole("button", { name: "Filtres actifs" });
    expect(filterButton).toHaveAttribute("aria-pressed", "true");
    expect(filterButton).toHaveAttribute("aria-label", "Filtres actifs");
  });

  it("affiche l'indicateur actif quand des filtres de localisation sont appliqués", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("departements=75,92")
    );

    render(<Filters />);

    const locationButton = screen.getByRole("button", {
      name: "Filtres par région / département actifs",
    });
    expect(locationButton).toHaveAttribute("aria-pressed", "true");
    expect(locationButton).toHaveAttribute(
      "aria-label",
      "Filtres par région / département actifs"
    );
  });

  it("n'affiche pas l'indicateur actif quand aucun filtre n'est appliqué", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    render(<Filters />);

    const filterButton = screen.getByRole("button", {
      name: "Filtres inactifs",
    });
    expect(filterButton).toHaveAttribute("aria-pressed", "false");
    expect(filterButton).toHaveAttribute("aria-label", "Filtres inactifs");

    const locationButton = screen.getByRole("button", {
      name: "Filtres par région / département inactifs",
    });
    expect(locationButton).toHaveAttribute("aria-pressed", "false");
    expect(locationButton).toHaveAttribute(
      "aria-label",
      "Filtres par région / département inactifs"
    );
  });
});
