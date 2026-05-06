import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/operateurs/suggestions/route";

const mockFindBySearchTerm = vi.fn();

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  findBySearchTerm: (...args: unknown[]) => mockFindBySearchTerm(...args),
}));

describe("GET /api/operateurs/suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return operateurs matching search term", async () => {
    // GIVEN
    const operateurs = [{ id: 1, name: "Adoma" }];
    mockFindBySearchTerm.mockResolvedValueOnce(operateurs);

    const request = new NextRequest(
      "http://localhost/api/operateurs/suggestions?search=Ado"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(operateurs);
    expect(mockFindBySearchTerm).toHaveBeenCalledWith("Ado");
  });

  it("should return all operateurs when no search term", async () => {
    // GIVEN
    const operateurs = [{ id: 1, name: "Adoma" }, { id: 2, name: "Forum Réfugiés" }];
    mockFindBySearchTerm.mockResolvedValueOnce(operateurs);

    const request = new NextRequest(
      "http://localhost/api/operateurs/suggestions"
    );

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(operateurs);
    expect(mockFindBySearchTerm).toHaveBeenCalledWith(null);
  });
});
