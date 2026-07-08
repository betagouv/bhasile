import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCampaigns } from "@/app/hooks/useCampaigns";

describe("useCampaigns.updateAndRefreshCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("sauvegarde, rafraîchit la structure et retourne OK", async () => {
    const setStructure = vi.fn();
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ json: async () => ({ id: 1, nom: "S" }) });

    const { result } = renderHook(() => useCampaigns());
    const outcome = await result.current.updateAndRefreshCampaign(
      1,
      { structureId: 1, year: 2026 },
      setStructure
    );

    expect(outcome).toBe("OK");
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/campaigns",
      expect.objectContaining({ method: "PUT" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/structures/1");
    expect(setStructure).toHaveBeenCalledWith({ id: 1, nom: "S" });
  });

  it("retourne le message d'erreur extrait quand l'API échoue", async () => {
    const setStructure = vi.fn();
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Année non ouverte" }),
    });

    const { result } = renderHook(() => useCampaigns());
    const outcome = await result.current.updateAndRefreshCampaign(
      1,
      { structureId: 1, year: 2026 },
      setStructure
    );

    expect(outcome).toBe("Année non ouverte");
    expect(setStructure).not.toHaveBeenCalled();
  });
});
