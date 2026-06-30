import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/dna-codes/route";

const mockFindAll = vi.fn();

vi.mock("@/app/api/dna-codes/dna-codes.repository", () => ({
  findAll: (...args: unknown[]) => mockFindAll(...args),
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
      operateurId: undefined,
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
      operateurId: undefined,
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
      operateurId: undefined,
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
      operateurId: undefined,
    });
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
