import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/dna-codes/route";

const mockFindAll = vi.fn();
const mockFindOperateurFamille = vi.fn();

vi.mock("@/app/api/dna-codes/dna-codes.repository", () => ({
  findAll: (...args: unknown[]) => mockFindAll(...args),
}));

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  findOperateurFamille: (...args: unknown[]) =>
    mockFindOperateurFamille(...args),
}));

describe("GET /api/dna-codes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne les dna-codes non attribués quand structureId est absent", async () => {
    // GIVEN
    const dnaCodes = [{ code: "C0001" }];
    mockFindAll.mockResolvedValueOnce(dnaCodes);

    const request = new NextRequest("http://localhost/api/dna-codes");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(dnaCodes);
    expect(mockFindAll).toHaveBeenCalledWith({
      entityId: { structureId: undefined, structureVersionId: undefined },
      operateurIds: undefined,
    });
  });

  it("se rabat sur les codes non attribués quand structureId n'est pas un nombre", async () => {
    // GIVEN
    const dnaCodes = [{ code: "C0001" }];
    mockFindAll.mockResolvedValueOnce(dnaCodes);

    const request = new NextRequest(
      "http://localhost/api/dna-codes?structureId=abc"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(dnaCodes);
    expect(mockFindAll).toHaveBeenCalledWith({
      entityId: { structureId: undefined, structureVersionId: undefined },
      operateurIds: undefined,
    });
  });

  it("retourne les dna-codes pour un structureId valide", async () => {
    // GIVEN
    const dnaCodes = [{ id: 1, code: "C0001" }];
    mockFindAll.mockResolvedValueOnce(dnaCodes);

    const request = new NextRequest(
      "http://localhost/api/dna-codes?structureId=42"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(dnaCodes);
    expect(mockFindAll).toHaveBeenCalledWith({
      entityId: { structureId: 42, structureVersionId: undefined },
      operateurIds: undefined,
    });
  });

  it("retourne les dna-codes pour un structureVersionId valide", async () => {
    // GIVEN
    const dnaCodes = [{ id: 1, code: "C0001" }];
    mockFindAll.mockResolvedValueOnce(dnaCodes);

    const request = new NextRequest(
      "http://localhost/api/dna-codes?structureVersionId=7"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(dnaCodes);
    expect(mockFindAll).toHaveBeenCalledWith({
      entityId: { structureId: undefined, structureVersionId: 7 },
      operateurIds: undefined,
    });
  });

  it("restreint les codes libres à la famille de l'opérateur demandé", async () => {
    // GIVEN
    mockFindAll.mockResolvedValueOnce([]);
    mockFindOperateurFamille.mockResolvedValueOnce([{ id: 3 }, { id: 5 }]);

    const request = new NextRequest(
      "http://localhost/api/dna-codes?structureId=42&operateurId=3"
    );

    // WHEN
    await GET(request);

    // THEN
    expect(mockFindOperateurFamille).toHaveBeenCalledWith(3);
    expect(mockFindAll).toHaveBeenCalledWith({
      entityId: { structureId: 42, structureVersionId: undefined },
      operateurIds: [3, 5],
    });
  });

  it("transmet le département et le type au repository", async () => {
    // GIVEN
    mockFindAll.mockResolvedValueOnce([]);

    const request = new NextRequest(
      "http://localhost/api/dna-codes?departementAdministratif=75&type=HUDA"
    );

    // WHEN
    await GET(request);

    // THEN
    expect(mockFindAll).toHaveBeenCalledWith({
      entityId: { structureId: undefined, structureVersionId: undefined },
      departementAdministratif: "75",
      type: "HUDA",
    });
  });

  it("ignore un type de structure inconnu", async () => {
    // GIVEN
    mockFindAll.mockResolvedValueOnce([]);

    const request = new NextRequest(
      "http://localhost/api/dna-codes?type=INCONNU"
    );

    // WHEN
    await GET(request);

    // THEN
    expect(mockFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ type: undefined })
    );
  });

  it("retourne 500 quand le repository lève une erreur", async () => {
    // GIVEN
    mockFindAll.mockRejectedValueOnce(new Error("DB error"));

    const request = new NextRequest(
      "http://localhost/api/dna-codes?structureId=42"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(500);
  });
});
