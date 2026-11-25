import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFetchFreeDnaCodes } from "@/app/hooks/useFetchFreeDnaCodes";

import { toJsonResponse } from "../test-utils/http.mock";

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
}));

describe("useFetchFreeDnaCodes", () => {
  it("n'expose pas la réponse quand l'API renvoie une erreur", async () => {
    const mockedFetch = vi
      .fn()
      .mockResolvedValue(
        toJsonResponse(500, { error: "Échec de la récupération des codes DNA" })
      );
    global.fetch = mockedFetch;

    const { result } = renderHook(() => useFetchFreeDnaCodes());
    await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
    await act(async () => {});

    expect(result.current.freeDnaCodes).toBeUndefined();
  });

  it("n'expose plus les codes des anciens filtres quand le rechargement échoue", async () => {
    const mockedFetch = vi
      .fn()
      .mockResolvedValueOnce(
        toJsonResponse(200, [{ code: "C0001", departementAdministratif: "75" }])
      )
      .mockResolvedValueOnce(
        toJsonResponse(500, { error: "Échec de la récupération des codes DNA" })
      );
    global.fetch = mockedFetch;

    const { result, rerender } = renderHook(
      ({ departementAdministratif }) =>
        useFetchFreeDnaCodes({ departementAdministratif }),
      { initialProps: { departementAdministratif: "75" } }
    );
    await waitFor(() => expect(result.current.freeDnaCodes).toHaveLength(1));

    rerender({ departementAdministratif: "92" });
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2));
    await act(async () => {});

    expect(result.current.freeDnaCodes).toBeUndefined();
  });

  it("ignore la réponse d'une requête périmée quand les filtres changent", async () => {
    const latestCodes = [{ code: "B0001", departementAdministratif: "13" }];
    let resolveStaleResponse: (response: unknown) => void = () => {};
    const mockedFetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveStaleResponse = resolve;
          })
      )
      .mockResolvedValueOnce(toJsonResponse(200, latestCodes));
    global.fetch = mockedFetch;

    const { result, rerender } = renderHook(
      ({ operateurId }) => useFetchFreeDnaCodes({ operateurId }),
      { initialProps: { operateurId: 1 } }
    );
    rerender({ operateurId: 2 });
    await waitFor(() =>
      expect(result.current.freeDnaCodes).toEqual(latestCodes)
    );

    await act(async () => {
      resolveStaleResponse(
        toJsonResponse(200, [{ code: "A0001", departementAdministratif: "75" }])
      );
    });

    expect(result.current.freeDnaCodes).toEqual(latestCodes);
  });
});
