import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Filters } from "@/app/(authenticated)/structures/_components/Filters";

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

describe("Filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should show active indicator when filters are applied", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("type=CADA&bati=DIFFUS")
    );

    render(<Filters />);

    const filterButton = screen.getByRole("button", { name: "Filtres actifs" });
    expect(filterButton).toHaveAttribute("aria-pressed", "true");
    expect(filterButton).toHaveAttribute("aria-label", "Filtres actifs");
  });

  it("should show active indicator when places filter is applied", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("places=10"));

    render(<Filters />);

    const filterButton = screen.getByRole("button", { name: "Filtres actifs" });
    expect(filterButton).toHaveAttribute("aria-pressed", "true");
    expect(filterButton).toHaveAttribute("aria-label", "Filtres actifs");
  });

  it("should show active indicator when location filters are applied", () => {
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

  it("should not show active indicator when no filters are applied", () => {
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
