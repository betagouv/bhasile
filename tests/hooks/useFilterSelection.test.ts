import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFilterSelection } from "@/hooks/useFilterSelection";

const mockReplace = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: vi.fn() }),
}));

describe("useFilterSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("lit la sélection depuis le paramètre de l'URL", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("types=CADA,HUDA"));

    const { result } = renderHook(() => useFilterSelection("types"));

    expect(result.current.selection).toEqual(["CADA", "HUDA"]);
  });

  it("ajoute une valeur absente de la sélection sans faire défiler la page", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("types=CADA"));
    const { result } = renderHook(() => useFilterSelection("types"));

    act(() => result.current.toggleValue("HUDA"));

    expect(mockReplace).toHaveBeenCalledWith("?types=CADA%2CHUDA", {
      scroll: false,
    });
  });

  it("retire une valeur déjà sélectionnée et supprime le paramètre devenu vide", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("types=CADA"));
    const { result } = renderHook(() => useFilterSelection("types"));

    act(() => result.current.toggleValue("CADA"));

    expect(mockReplace).toHaveBeenCalledWith("?", { scroll: false });
  });

  it("réinitialise la pagination en changeant la sélection", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("types=CADA&actualisationsPage=2")
    );
    const { result } = renderHook(() => useFilterSelection("types"));

    act(() => result.current.setSelection([]));

    expect(mockReplace).toHaveBeenCalledWith("?", { scroll: false });
  });

  it("ne navigue pas quand la sélection est déjà vide", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("actualisationsPage=2")
    );
    const { result } = renderHook(() => useFilterSelection("types"));

    act(() => result.current.setSelection([]));

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
