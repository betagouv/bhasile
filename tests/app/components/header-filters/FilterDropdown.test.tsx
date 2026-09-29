import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilterDropdown } from "@/app/components/header-filters/FilterDropdown";

const mockReplace = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: vi.fn() }),
}));

const renderDropdown = () =>
  render(
    <FilterDropdown
      label="Zone"
      placeholder="Toute la France"
      filterId="departements"
      getSummaryLabel={(departements) => `Résumé de ${departements.join("/")}`}
    >
      {({ selection }) => <p>Options pour {selection.join("/") || "aucun"}</p>}
    </FilterDropdown>
  );

describe("FilterDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("affiche le placeholder quand le paramètre est une chaîne vide", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("departements="));

    renderDropdown();

    expect(screen.getByText("Toute la France")).toBeInTheDocument();
  });

  it("affiche le placeholder quand le paramètre est absent", () => {
    renderDropdown();

    expect(screen.getByText("Toute la France")).toBeInTheDocument();
    expect(screen.queryByText(/Résumé/)).not.toBeInTheDocument();
  });

  it("affiche le résumé fourni quand le paramètre a des valeurs", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("departements=75,92")
    );

    renderDropdown();

    expect(screen.getByText("Résumé de 75/92")).toBeInTheDocument();
    expect(screen.queryByText("Toute la France")).not.toBeInTheDocument();
  });

  it("coche « Tous » et transmet une sélection vide quand aucun filtre n'est appliqué", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /Zone/ }));

    expect(
      screen.getByRole("checkbox", { name: "Toute la France" })
    ).toBeChecked();
    expect(screen.getByText("Options pour aucun")).toBeInTheDocument();
  });

  it("décoche « Tous » et transmet la sélection quand un filtre est appliqué", async () => {
    const user = userEvent.setup();
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("departements=75,92")
    );
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /Zone/ }));

    expect(
      screen.getByRole("checkbox", { name: "Toute la France" })
    ).not.toBeChecked();
    expect(screen.getByText("Options pour 75/92")).toBeInTheDocument();
  });

  it("supprime le filtre au clic sur « Tous »", async () => {
    const user = userEvent.setup();
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("departements=75&operateurs=3")
    );
    renderDropdown();

    await user.click(screen.getByRole("button", { name: /Zone/ }));
    await user.click(screen.getByRole("checkbox", { name: "Toute la France" }));

    expect(mockReplace).toHaveBeenCalledWith("?operateurs=3", {
      scroll: false,
    });
  });
});
