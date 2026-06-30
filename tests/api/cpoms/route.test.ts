import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/cpoms/route";

const mockFindBySearch = vi.fn();
const mockCountBySearch = vi.fn();
const mockCreateOrUpdateCpom = vi.fn();
const mockCreateCpomEvent = vi.fn();

vi.mock("@/app/api/cpoms/cpom.repository", () => ({
  findBySearch: (...args: unknown[]) => mockFindBySearch(...args),
  countBySearch: (...args: unknown[]) => mockCountBySearch(...args),
  createOrUpdateCpom: (...args: unknown[]) => mockCreateOrUpdateCpom(...args),
}));

vi.mock("@/app/api/user-action/user-action.service", () => ({
  createCpomEvent: (...args: unknown[]) => mockCreateCpomEvent(...args),
}));

describe("GET /api/cpoms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne les cpoms et le total", async () => {
    // GIVEN
    const cpoms = [{ id: 1 }];
    const totalCpoms = 5;
    mockFindBySearch.mockResolvedValueOnce(cpoms);
    mockCountBySearch.mockResolvedValueOnce(totalCpoms);

    const request = new NextRequest("http://localhost/api/cpoms");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      cpoms: [{ id: 1, dateStart: null, dateEnd: null }],
      totalCpoms,
    });
    expect(mockFindBySearch).toHaveBeenCalledWith({
      page: null,
      departements: null,
      column: null,
      direction: null,
    });
    expect(mockCountBySearch).toHaveBeenCalledWith({ departements: null });
  });

  it("retourne 500 quand le repository lève une erreur", async () => {
    // GIVEN
    mockFindBySearch.mockRejectedValueOnce(new Error("DB error"));
    mockCountBySearch.mockResolvedValueOnce(0);

    const request = new NextRequest("http://localhost/api/cpoms");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(500);
  });
});

describe("POST /api/cpoms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 201 avec le cpomId en cas de succès", async () => {
    // GIVEN
    const payload = { id: 1, operateur: { name: "Opérateur Test" } };
    mockCreateOrUpdateCpom.mockResolvedValueOnce(1);

    const request = new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // WHEN
    const response = await POST(request as NextRequest);

    // THEN
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ cpomId: 1 });
    expect(mockCreateCpomEvent).toHaveBeenCalledWith("POST", 1);
  });

  it("retourne 400 quand le nom de l'opérateur est manquant", async () => {
    // GIVEN
    const request = new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify({ id: 1, operateur: { name: "" } }),
    });

    // WHEN
    const response = await POST(request as NextRequest);

    // THEN
    expect(response.status).toBe(400);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
    expect(mockCreateCpomEvent).not.toHaveBeenCalled();
    expect(mockFindBySearch).not.toHaveBeenCalled();
    expect(mockCountBySearch).not.toHaveBeenCalled();
  });
});

