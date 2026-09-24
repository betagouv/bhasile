import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/operateurs/suggestions/route";

const mockFindBySearchTerm = vi.fn();

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  findBySearchTerm: (...args: unknown[]) => mockFindBySearchTerm(...args),
}));

vi.mock("@/app/api/structures/structure.repository", () => ({
  findAllStructures: vi.fn(),
}));

const makeRow = (
  id: number,
  name: string,
  { parentId = null, filialeIds = [] }: RowOptions = {}
) => ({
  id,
  name,
  parentId,
  filiales: filialeIds.map((filialeId) => ({ id: filialeId })),
});

type RowOptions = { parentId?: number | null; filialeIds?: number[] };

describe("GET /api/operateurs/suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renvoie les opérateurs correspondant au terme de recherche", async () => {
    // GIVEN
    mockFindBySearchTerm.mockResolvedValueOnce([makeRow(1, "Adoma")]);

    const request = new NextRequest(
      "http://localhost/api/operateurs/suggestions?search=Ado"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { id: 1, name: "Adoma", isFiliale: false, hasFiliales: false },
    ]);
    expect(mockFindBySearchTerm).toHaveBeenCalledWith("Ado");
  });

  it("renvoie tous les opérateurs quand pas de terme de recherche", async () => {
    // GIVEN
    mockFindBySearchTerm.mockResolvedValueOnce([
      makeRow(1, "Adoma"),
      makeRow(2, "Forum Réfugiés"),
    ]);

    const request = new NextRequest(
      "http://localhost/api/operateurs/suggestions"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(
      (await response.json()).map(
        (operateur: { name: string }) => operateur.name
      )
    ).toEqual(["Adoma", "Forum Réfugiés"]);
    expect(mockFindBySearchTerm).toHaveBeenCalledWith(null);
  });

  it("signale les filiales et les groupes", async () => {
    // GIVEN
    mockFindBySearchTerm.mockResolvedValueOnce([
      makeRow(1, "Groupe SOS", { filialeIds: [2] }),
      makeRow(2, "Ysos", { parentId: 1 }),
      makeRow(3, "Adoma"),
    ]);

    const request = new NextRequest(
      "http://localhost/api/operateurs/suggestions"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(await response.json()).toEqual([
      { id: 3, name: "Adoma", isFiliale: false, hasFiliales: false },
      { id: 1, name: "Groupe SOS", isFiliale: false, hasFiliales: true },
      { id: 2, name: "Ysos", isFiliale: true, hasFiliales: false },
    ]);
  });

  it("trie les opérateurs par ordre alphabétique", async () => {
    // GIVEN
    mockFindBySearchTerm.mockResolvedValueOnce([
      makeRow(1, "France terre d'asile"),
      makeRow(2, "Adoma"),
      makeRow(3, "Émmaüs"),
    ]);

    const request = new NextRequest(
      "http://localhost/api/operateurs/suggestions"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(
      (await response.json()).map(
        (operateur: { name: string }) => operateur.name
      )
    ).toEqual(["Adoma", "Émmaüs", "France terre d'asile"]);
  });
});
