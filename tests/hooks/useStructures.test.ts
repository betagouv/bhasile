import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AjoutFormValues,
  transformAjoutFormStructureToApiStructure,
  useStructures,
} from "@/app/hooks/useStructures";

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

  describe("addStructure", () => {
    it("appelle POST /api/structures avec le payload transformé", async () => {
      // GIVEN
      const values = {
        id: 123,
      } as AjoutFormValues;

      mockFetch.mockResolvedValueOnce(toJsonResponse(201, {}));

      // WHEN
      const { result } = renderHook(() => useStructures());

      await act(async () => {
        await result.current.addStructure(values);
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
    });

    it("rejette avec le message serveur quand le POST échoue", async () => {
      // GIVEN
      const values: AjoutFormValues = { id: 456 };
      mockFetch.mockResolvedValueOnce(
        toJsonResponse(400, { error: "Invalid payload" })
      );

      // WHEN
      const { result } = renderHook(() => useStructures());

      // THEN
      await act(async () => {
        await expect(result.current.addStructure(values)).rejects.toThrow(
          "Invalid payload"
        );
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("transformAjoutFormStructureToApiStructure", () => {
    it("should transform dates, french numbers and contacts", async () => {
      // GIVEN
      const values = JSON.parse(
        JSON.stringify({
          id: 777,
          codeBhasile: "BHA-777",
          operateur: { id: 9, name: "Operateur complet" },
          filiale: "Filiale test",
          type: "CADA",
          adresseAdministrative: "10 rue de Rivoli",
          codePostalAdministratif: "75001",
          communeAdministrative: "Paris",
          departementAdministratif: "75",
          nom: "Structure complete",
          debutConvention: "01/02/2024",
          finConvention: "31/12/2026",
          creationDate: "15/03/2020",
          date303: "16/04/2021",
          lgbt: true,
          fvvTeh: false,
          public: "Tout public",
          adresses: [],
          antennes: [],
          dnaStructures: [{ id: 1, description: "", dna: { code: "C0001" } }],
          structureFinesses: [
            { id: 1, description: "", finess: { id: 1, code: "123456789" } },
          ],
          contacts: [
            { nom: "", prenom: "", role: "", email: "", telephone: "" },
            {
              nom: "Valide",
              prenom: "Contact",
              role: "Direction",
              email: "contact@example.com",
              telephone: "0102030405",
            },
          ],
          structureMillesimes: [{ year: 2024, operateurComment: null }],
          typologies: [
            {
              id: 1,
              year: 2024,
              placesAutorisees: "1 234",
              pmr: "12,5",
              lgbt: "3",
              fvvTeh: " 7 ",
              placesACreer: 2,
              placesAFermer: 1,
            },
          ],
          documentsFinanciers: [],
        })
      );

      // WHEN
      const payload = await transformAjoutFormStructureToApiStructure(values);

      // THEN
      expect(payload).toEqual({
        id: 777,
        codeBhasile: "BHA-777",
        operateur: { id: 9, name: "Operateur complet" },
        filiale: "Filiale test",
        type: "CADA",
        adresseAdministrative: "10 rue de Rivoli",
        codePostalAdministratif: "75001",
        communeAdministrative: "Paris",
        departementAdministratif: "75",
        nom: "Structure complete",
        creationDate: "2020-03-15T12:00:00.000Z",
        date303: "2021-04-16T12:00:00.000Z",
        lgbt: true,
        fvvTeh: false,
        public: "Tout public",
        adresses: [],
        antennes: [],
        dnaStructures: [{ id: 1, description: "", dna: { code: "C0001" } }],
        structureFinesses: [
          { id: 1, description: "", finess: { id: 1, code: "123456789" } },
        ],
        contacts: [
          {
            nom: "Valide",
            prenom: "Contact",
            role: "Direction",
            email: "contact@example.com",
            telephone: "0102030405",
          },
        ],
        structureMillesimes: [{ year: 2024, operateurComment: undefined }],
        structureTypologies: [
          {
            id: 1,
            year: 2024,
            placesAutorisees: 1234,
            pmr: 12.5,
            lgbt: 3,
            fvvTeh: 7,
            placesACreer: 2,
            placesAFermer: 1,
          },
        ],
        documentsFinanciers: [],
      });
    });
  });

  describe("updateAndRefreshStructure", () => {
    it("met à jour puis recharge la structure et appelle setStructure", async () => {
      // GIVEN
      const structureId = 12;
      const partialUpdate = { nom: "Structure mise à jour" };
      const updatedStructure = {
        id: structureId,
        nom: "Structure mise à jour",
      };
      const setStructure = vi.fn();

      mockFetch
        .mockResolvedValueOnce(toJsonResponse(200, {}))
        .mockResolvedValueOnce(toJsonResponse(200, updatedStructure));

      // WHEN
      const { result } = renderHook(() => useStructures());

      await act(async () => {
        await result.current.updateAndRefreshStructure(
          structureId,
          partialUpdate,
          setStructure
        );
      });

      // THEN
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        `/api/structures/${structureId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...partialUpdate,
            id: structureId,
          }),
        }
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        `/api/structures/${structureId}`
      );
      expect(setStructure).toHaveBeenCalledWith(updatedStructure);
    });

    it("ne recharge pas la structure quand la mise à jour échoue", async () => {
      // GIVEN
      const structureId = 99;
      const setStructure = vi.fn();
      mockFetch.mockResolvedValueOnce(
        toJsonResponse(400, { error: "Update failed" })
      );

      // WHEN
      const { result } = renderHook(() => useStructures());

      // THEN
      await act(async () => {
        await expect(
          result.current.updateAndRefreshStructure(
            structureId,
            { nom: "ko" },
            setStructure
          )
        ).rejects.toThrow("Update failed");
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(setStructure).not.toHaveBeenCalled();
    });
  });
});
