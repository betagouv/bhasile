import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStructuresSearch } from "@/app/hooks/useStructuresSearch";

global.fetch = vi.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalFetch = global.fetch as any;

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/app/context/FetchStateContext", () => ({
  useFetchState: () => ({
    setFetchState: vi.fn(),
    getFetchState: vi.fn(() => "idle"),
  }),
}));

describe("useStructuresSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should fetch structures with column and direction params", async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("column=dnaCode&direction=asc")
    );

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        structures: [],
        totalStructures: 0,
      }),
    });

    renderHook(() => useStructuresSearch({ map: false }));

    await waitFor(() => {
      expect(globalFetch).toHaveBeenCalled();
    });

    const fetchCall = globalFetch.mock.calls[0][0];
    expect(fetchCall).toContain("column=dnaCode");
    expect(fetchCall).toContain("direction=asc");
  });

  it("should fetch structures with filter params", async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("type=CADA&departements=75,92&bati=DIFFUS")
    );

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        structures: [],
        totalStructures: 0,
      }),
    });

    renderHook(() => useStructuresSearch({ map: false }));

    await waitFor(() => {
      expect(globalFetch).toHaveBeenCalled();
    });

    const fetchCall = globalFetch.mock.calls[0][0];
    expect(fetchCall).toContain("type=CADA");
    // URL encoding: comma becomes %2C
    expect(fetchCall).toMatch(/departements=75(%2C|,)92/);
    expect(fetchCall).toContain("bati=DIFFUS");
  });

  it("should read column and direction params from URL", async () => {
    // Test that the hook correctly reads params from URL
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("column=type&direction=desc")
    );

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ structures: [], totalStructures: 0 }),
    });

    renderHook(() => useStructuresSearch({ map: false }));

    await waitFor(() => {
      expect(globalFetch).toHaveBeenCalled();
    });

    // Verify the API was called with the correct params from URL

    const fetchCall = globalFetch.mock.calls[0][0];
    expect(fetchCall).toContain("column=type");
    expect(fetchCall).toContain("direction=desc");
  });

  it("should set structures and totalStructures from API response", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    const mockStructures = [
      { id: 1, dnaCode: "C0001", type: "CADA" },
      { id: 2, dnaCode: "C0002", type: "CPH" },
    ];

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        structures: mockStructures,
        totalStructures: 2,
      }),
    });

    const { result } = renderHook(() => useStructuresSearch({ map: false }));

    await waitFor(() => {
      expect(result.current.structures).toBeDefined();
    });

    expect(result.current.structures).toEqual(mockStructures);
    expect(result.current.totalStructures).toBe(2);
  });
});
