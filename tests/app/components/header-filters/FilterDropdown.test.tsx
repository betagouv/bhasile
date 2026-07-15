import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilterDropdown } from "@/app/components/header-filters/FilterDropdown";

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

describe("FilterDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le placeholder quand le paramètre est une chaîne vide", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("departements="));

    render(
      <FilterDropdown
        label="Zone"
        placeholder="Sélectionnez une zone"
        filterId="departements"
      >
        <div />
      </FilterDropdown>
    );

    expect(screen.getByText("Sélectionnez une zone")).toBeInTheDocument();
    expect(
      screen.queryByText(/filtre\(s\) sélectionné\(s\)/)
    ).not.toBeInTheDocument();
  });

  it("affiche le placeholder quand le paramètre est absent", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    render(
      <FilterDropdown
        label="Zone"
        placeholder="Sélectionnez une zone"
        filterId="departements"
      >
        <div />
      </FilterDropdown>
    );

    expect(screen.getByText("Sélectionnez une zone")).toBeInTheDocument();
    expect(
      screen.queryByText(/filtre\(s\) sélectionné\(s\)/)
    ).not.toBeInTheDocument();
  });

  it("affiche le nombre de filtres sélectionnés quand le paramètre a des valeurs", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("departements=75,92")
    );

    render(
      <FilterDropdown
        label="Zone"
        placeholder="Sélectionnez une zone"
        filterId="departements"
      >
        <div />
      </FilterDropdown>
    );

    expect(
      screen.getByText("2 filtre(s) sélectionné(s)")
    ).toBeInTheDocument();
    expect(screen.queryByText("Sélectionnez une zone")).not.toBeInTheDocument();
  });
});
