import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFiltersConstraints } from "@/components/header-filters/useFiltersConstraints";

const mockReplace = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: vi.fn() }),
}));

describe("useFiltersConstraints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ne fait rien quand les filtres respectent les contraintes de la page", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("departements=14&types=CADA")
    );

    const { result } = renderHook(() =>
      useFiltersConstraints({ hiddenFilters: [], isSingleZone: true })
    );

    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("réduit la zone à une seule et prévient l'utilisateur", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("departements=50,33,14&types=CADA")
    );

    const { result } = renderHook(() =>
      useFiltersConstraints({ hiddenFilters: [], isSingleZone: true })
    );

    expect(mockReplace).toHaveBeenCalledWith("?departements=14&types=CADA", {
      scroll: false,
    });
    expect(result.current).toEqual({
      kind: "zone",
      before: "Calvados +2",
      after: "Calvados",
    });
  });

  it("réinitialise un filtre masqué et prévient l'utilisateur", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("departements=14&types=CADA")
    );

    const { result } = renderHook(() =>
      useFiltersConstraints({ hiddenFilters: ["types"], isSingleZone: false })
    );

    expect(mockReplace).toHaveBeenCalledWith("?departements=14", {
      scroll: false,
    });
    expect(result.current).toEqual({ kind: "hidden", resetKeys: ["types"] });
  });
});
