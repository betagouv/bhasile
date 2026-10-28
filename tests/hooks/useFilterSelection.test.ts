import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StructureType } from "@/generated/prisma/client";
import { useFilterSelection } from "@/hooks/useFilterSelection";
import { ACCEPTED_STRUCTURE_TYPES } from "@/types/structure.type";

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

  it("coche toutes les valeurs quand aucun filtre n'est appliqué", () => {
    const { result } = renderHook(() => useFilterSelection("types"));

    expect(result.current.status).toBe("all");
    expect(result.current.getCheckedValues(ACCEPTED_STRUCTURE_TYPES)).toEqual(
      ACCEPTED_STRUCTURE_TYPES
    );
  });

  it("filtre sur les valeurs restantes quand on en décoche une depuis « tout »", () => {
    const { result } = renderHook(() => useFilterSelection("types"));

    act(() =>
      result.current.setCheckedValues(
        [StructureType.CADA, StructureType.CAES, StructureType.CPH],
        ACCEPTED_STRUCTURE_TYPES
      )
    );

    expect(mockReplace).toHaveBeenCalledWith("?types=CADA%2CCAES%2CCPH", {
      scroll: false,
    });
  });

  it("retire le filtre et la pagination quand toutes les valeurs finissent cochées", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("types=CADA,CAES,CPH&actualisationsPage=2")
    );
    const { result } = renderHook(() => useFilterSelection("types"));

    act(() =>
      result.current.setCheckedValues(
        ACCEPTED_STRUCTURE_TYPES,
        ACCEPTED_STRUCTURE_TYPES
      )
    );

    expect(mockReplace).toHaveBeenCalledWith("?", { scroll: false });
  });

  it("décoche tout sans filtrer, jusqu'à la fermeture qui revient à « tout »", () => {
    const { result } = renderHook(() => useFilterSelection("types"));

    act(() => result.current.toggleAll());

    expect(result.current.status).toBe("none");
    expect(result.current.getCheckedValues(ACCEPTED_STRUCTURE_TYPES)).toEqual(
      []
    );
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => result.current.resetCleared());

    expect(result.current.status).toBe("all");
  });

  it("recoche tout depuis une sélection partielle", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("types=CADA"));
    const { result } = renderHook(() => useFilterSelection("types"));

    expect(result.current.status).toBe("some");

    act(() => result.current.toggleAll());

    expect(mockReplace).toHaveBeenCalledWith("?", { scroll: false });
  });
});
