import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStructures } from "@/app/hooks/useStructures";

import {
  installMockFetch,
  mockFetch,
  toJsonResponse,
} from "../test-utils/http.mock";

installMockFetch();

describe("useStructures integration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("updateStructure", () => {
    it("envoie la mise à jour en PUT sur la structure ciblée", async () => {
      // GIVEN
      const structureId = 12;
      const partialUpdate = { nom: "Structure mise à jour" };
      mockFetch.mockResolvedValueOnce(toJsonResponse(200, {}));

      // WHEN
      const { result } = renderHook(() => useStructures());

      await act(async () => {
        await result.current.updateStructure({
          ...partialUpdate,
          id: structureId,
        });
      });

      // THEN
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(`/api/structures/${structureId}`, {
        method: "PUT",
        body: JSON.stringify({ ...partialUpdate, id: structureId }),
      });
    });

    it("remonte l'erreur de l'API sans recharger la structure", async () => {
      // GIVEN
      mockFetch.mockResolvedValueOnce(
        toJsonResponse(400, { error: "Update failed" })
      );

      // WHEN
      const { result } = renderHook(() => useStructures());

      // THEN
      await act(async () => {
        await expect(
          result.current.updateStructure({ nom: "ko", id: 99 })
        ).rejects.toThrow("Update failed");
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
