import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { ApiError } from "@/app/utils/apiError.util";

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();
const mockSetFetchState = vi.fn();
const mockUpdateStructure = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
}));
vi.mock("@/contexts/StructureContext", () => ({
  useStructureContext: () => ({ structure: { id: 1, forms: [] } }),
}));
vi.mock("@/app/hooks/useStructures", () => ({
  useStructures: () => ({
    updateStructure: (...args: unknown[]) => mockUpdateStructure(...args),
  }),
}));
vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: mockSetFetchState }),
}));

describe("useAgentFormHandling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateStructure.mockResolvedValue(undefined);
  });

  it("envoie la mise à jour avec l'id de la structure du contexte", async () => {
    const { result } = renderHook(() => useAgentFormHandling());

    await result.current.handleSubmit({ id: 99, nom: "Nouveau nom" });

    expect(mockUpdateStructure).toHaveBeenCalledWith({
      nom: "Nouveau nom",
      id: 1,
    });
  });

  it("ne rafraîchit le rendu serveur qu'une seule fois après une soumission", async () => {
    const { result } = renderHook(() => useAgentFormHandling());

    await result.current.handleSubmit({ id: 99, nom: "Nouveau nom" });

    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
  });

  it("navigue vers la route suivante après une soumission réussie", async () => {
    const { result } = renderHook(() =>
      useAgentFormHandling({ nextRoute: "/structures/1" })
    );

    await result.current.handleSubmit({ id: 99, nom: "Nouveau nom" });

    expect(mockRouterPush).toHaveBeenCalledWith("/structures/1");
  });

  it("ne navigue pas quand la sauvegarde échoue", async () => {
    mockUpdateStructure.mockRejectedValue(new ApiError("Échec", 400));
    const { result } = renderHook(() =>
      useAgentFormHandling({ nextRoute: "/structures/1" })
    );

    await result.current.handleSubmit({ id: 99, nom: "Nouveau nom" });

    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });
});
