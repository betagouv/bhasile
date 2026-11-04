import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTarificationActions } from "@/hooks/useTarificationActions";

const mockFetch = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const file = new File(["contenu"], "reponse.pdf", {
  type: "application/pdf",
});

const answer = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const getCalls = () =>
  mockFetch.mock.calls.map(([url, init]) => [url, init?.method]);

const renderActions = () =>
  renderHook(() => useTarificationActions({ structureId: 42, year: 2028 }))
    .result.current;

describe("useTarificationActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  it("envoie le fichier, puis écrit la réponse et sa pièce en un seul appel", async () => {
    mockFetch
      .mockResolvedValueOnce(answer({ key: "reponse.pdf" }))
      .mockResolvedValueOnce(answer({ id: 10 }, 201));
    const { respondToL48 } = renderActions();

    await act(() =>
      respondToL48({ type: "L48_CONTESTED", text: "Montant erroné", file })
    );

    expect(getCalls()).toEqual([
      ["/api/files", "POST"],
      ["/api/tarifications/42/2028/events", "POST"],
    ]);
    expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
      type: "L48_CONTESTED",
      text: "Montant erroné",
      fileKey: "reponse.pdf",
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("supprime le fichier envoyé quand la réponse est refusée, et ne relit rien", async () => {
    mockFetch
      .mockResolvedValueOnce(answer({ key: "reponse.pdf" }))
      .mockResolvedValueOnce(answer({ error: "Délai dépassé" }, 409))
      .mockResolvedValueOnce(answer({}));
    const { respondToL48 } = renderActions();

    await expect(
      respondToL48({ type: "L48_CONTESTED", text: "Montant erroné", file })
    ).rejects.toThrow("Délai dépassé");

    expect(getCalls()).toEqual([
      ["/api/files", "POST"],
      ["/api/tarifications/42/2028/events", "POST"],
      ["/api/files/reponse.pdf", "DELETE"],
    ]);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("répond sans pièce jointe sans passer par un dépôt", async () => {
    mockFetch.mockResolvedValueOnce(answer({ id: 10 }, 201));
    const { respondToL48 } = renderActions();

    await act(() =>
      respondToL48({ type: "L48_ACCEPTED", text: "", file: null })
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      type: "L48_ACCEPTED",
      text: "",
    });
  });

  it("supprime le fichier envoyé quand le dépôt est refusé, et ne relit rien", async () => {
    mockFetch
      .mockResolvedValueOnce(answer({ key: "depot.pdf" }))
      .mockResolvedValueOnce(answer({ error: "Pas ouvert" }, 409))
      .mockResolvedValueOnce(answer({}));
    const { depositDocument } = renderActions();

    await expect(
      depositDocument({ file, type: "CA", status: "SHARED" })
    ).rejects.toThrow("Pas ouvert");

    expect(getCalls()).toEqual([
      ["/api/files", "POST"],
      ["/api/tarifications/42/2028/documents", "POST"],
      ["/api/files/depot.pdf", "DELETE"],
    ]);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("relit la page depuis le serveur après un fait accepté, jamais après un refus", async () => {
    mockFetch.mockResolvedValueOnce(answer({ id: 1 }, 201));
    const { recordEvent } = renderActions();

    await act(() => recordEvent({ type: "APPROVED", documentId: 7 }));
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValueOnce(answer({ error: "Refusé" }, 403));
    await expect(
      recordEvent({ type: "APPROVED", documentId: 7 })
    ).rejects.toThrow("Refusé");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
