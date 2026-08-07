import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSaveMutation } from "@/app/hooks/useSaveMutation";
import { ApiError } from "@/app/utils/apiError.util";

const mockRouterRefresh = vi.fn();
const mockSetFetchState = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}));

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: mockSetFetchState }),
}));

describe("useSaveMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rafraîchit le rendu serveur après une mutation réussie", async () => {
    // WHEN
    const { result } = renderHook(() =>
      useSaveMutation("save", async () => 42)
    );
    await result.current.mutate();

    // THEN
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
  });

  it("ne rafraîchit pas quand shouldRefresh est false", async () => {
    // WHEN
    const { result } = renderHook(() =>
      useSaveMutation("save", async () => 42, { shouldRefresh: false })
    );
    await result.current.mutate();

    // THEN
    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });

  it("ne rafraîchit pas quand la mutation échoue", async () => {
    // WHEN
    const { result } = renderHook(() =>
      useSaveMutation("save", async () => {
        throw new ApiError("boom", 500);
      })
    );
    const data = await result.current.mutate();

    // THEN
    expect(data).toBeNull();
    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });
});
