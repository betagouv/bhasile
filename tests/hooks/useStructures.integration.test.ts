import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStructures } from "@/app/hooks/useStructures";

import {
  installMockFetch,
  mockFetch,
  toJsonResponse,
} from "../test-utils/http.mock";

installMockFetch();

describe("useStructures integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("addStructure", () => {
    it("should send a transformed payload to POST /api/structures", async () => {
      // GIVEN
      const values = {
        id: 123,
        codeBhasile: "BH-123",
        type: "CADA",
        operateur: { name: "Operateur test", id: 42 },
        nom: "Structure test",
        adresseAdministrative: "1 rue de la paix",
        codePostalAdministratif: "75001",
        communeAdministrative: "Paris",
        departementAdministratif: "75",
        contacts: [
          {
            nom: "Contact test",
            prenom: "Contact",
            role: "Contact",
            email: "contact@test.com",
            telephone: "0123456789",
          },
        ],
        adresses: [],
        antennes: [],
        dnaStructures: [],
        finesses: [],
        typologies: [],
        documentsFinanciers: [],
      } as Parameters<ReturnType<typeof useStructures>["addStructure"]>[0];

      mockFetch.mockResolvedValueOnce(toJsonResponse(201, {}));

      // WHEN
      const { result } = renderHook(() => useStructures());
      let response = "";

      await act(async () => {
        response = await result.current.addStructure(values);
      });

      // THEN
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/structures",
        expect.objectContaining({
          method: "POST",
          body: expect.any(String),
        })
      );
      expect(response).toBe("OK");
    });

    it("should return serialized API error when POST fails", async () => {
      // GIVEN
      const values = { id: 456 } as Parameters<
        ReturnType<typeof useStructures>["addStructure"]
      >[0];
      const apiError = { error: "Invalid payload" };
      mockFetch.mockResolvedValueOnce(toJsonResponse(400, apiError));

      // WHEN
      const { result } = renderHook(() => useStructures());
      let response = "";

      await act(async () => {
        response = await result.current.addStructure(values);
      });

      // THEN
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response).toBe(JSON.stringify(apiError));
    });
  });

  describe("updateAndRefreshStructure", () => {
    it("should update then refetch structure and call setStructure", async () => {
      // GIVEN
      const structureId = 12;
      const partialUpdate = { nom: "Structure mise a jour" };
      const updatedStructure = {
        id: structureId,
        nom: "Structure mise a jour",
      };
      const setStructure = vi.fn();

      mockFetch
        .mockResolvedValueOnce(toJsonResponse(200, {}))
        .mockResolvedValueOnce(toJsonResponse(200, updatedStructure));

      // WHEN
      const { result } = renderHook(() => useStructures());
      let response = "";

      await act(async () => {
        response = await result.current.updateAndRefreshStructure(
          structureId,
          partialUpdate,
          setStructure
        );
      });

      // THEN
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/structures", {
        method: "PUT",
        body: JSON.stringify({
          ...partialUpdate,
          id: structureId,
        }),
      });
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        `/api/structures/${structureId}`
      );
      expect(setStructure).toHaveBeenCalledWith(updatedStructure);
      expect(response).toBe("OK");
    });

    it("should not refetch structure when update fails", async () => {
      // GIVEN
      const structureId = 99;
      const apiError = { error: "Update failed" };
      const setStructure = vi.fn();
      mockFetch.mockResolvedValueOnce(toJsonResponse(400, apiError));

      // WHEN
      const { result } = renderHook(() => useStructures());
      let response = "";

      await act(async () => {
        response = await result.current.updateAndRefreshStructure(
          structureId,
          { nom: "ko" },
          setStructure
        );
      });

      // THEN
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(setStructure).not.toHaveBeenCalled();
      expect(response).toBe(JSON.stringify(apiError));
    });
  });
});
