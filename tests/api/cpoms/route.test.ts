import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/cpoms/route";

const mockFindAllCpoms = vi.fn();
const mockCreateOrUpdateCpom = vi.fn();
const mockCreateCpomEvent = vi.fn();

vi.mock("@/app/api/cpoms/cpom.repository", () => ({
  findAllCpoms: () => mockFindAllCpoms(),
  createOrUpdateCpom: (...args: unknown[]) => mockCreateOrUpdateCpom(...args),
}));

vi.mock("@/app/api/user-action/user-action.service", () => ({
  createCpomEvent: (...args: unknown[]) => mockCreateCpomEvent(...args),
}));

const makeCpom = (overrides: Record<string, unknown>) => ({
  operateur: { name: "Opérateur" },
  region: { name: "Région" },
  granularity: "DEPARTEMENTALE",
  structures: [],
  departements: [],
  actesAdministratifs: [],
  budgets: [],
  ...overrides,
});

describe("GET /api/cpoms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne les cpoms avec les dates dérivées et le total filtré", async () => {
    mockFindAllCpoms.mockResolvedValueOnce([
      makeCpom({ id: 1 }),
      makeCpom({ id: 2 }),
    ]);

    const response = await GET(new NextRequest("http://localhost/api/cpoms"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totalCpoms).toBe(2);
    expect(body.cpoms).toHaveLength(2);
    expect(body.cpoms[0]).toMatchObject({ dateStart: null, dateEnd: null });
  });

  it("filtre par appartenance à un département et le reflète dans le total", async () => {
    mockFindAllCpoms.mockResolvedValueOnce([
      makeCpom({ id: 1, departements: [{ departement: { numero: "75" } }] }),
      makeCpom({ id: 2, departements: [{ departement: { numero: "92" } }] }),
      makeCpom({ id: 3, departements: [{ departement: { numero: "75" } }] }),
    ]);

    const response = await GET(
      new NextRequest("http://localhost/api/cpoms?departements=75")
    );

    const body = await response.json();
    expect(body.totalCpoms).toBe(2);
    expect(body.cpoms.map((cpom: { id: number }) => cpom.id)).toEqual([1, 3]);
  });

  it("trie selon la colonne et la direction demandées", async () => {
    mockFindAllCpoms.mockResolvedValueOnce([
      makeCpom({ id: 1, operateur: { name: "Charlie" } }),
      makeCpom({ id: 2, operateur: { name: "Alpha" } }),
      makeCpom({ id: 3, operateur: { name: "Bravo" } }),
    ]);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/cpoms?column=operateur&direction=asc"
      )
    );

    const body = await response.json();
    expect(
      body.cpoms.map((cpom: { operateur: { name: string } }) => cpom.operateur.name)
    ).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("retourne 500 quand le repository lève une erreur", async () => {
    mockFindAllCpoms.mockRejectedValueOnce(new Error("DB error"));

    const response = await GET(new NextRequest("http://localhost/api/cpoms"));

    expect(response.status).toBe(500);
  });
});

describe("POST /api/cpoms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 201 avec le cpomId en cas de succès", async () => {
    const payload = { id: 1, operateur: { name: "Opérateur Test" } };
    mockCreateOrUpdateCpom.mockResolvedValueOnce(1);

    const request = new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ cpomId: 1 });
    expect(mockCreateCpomEvent).toHaveBeenCalledWith("POST", 1);
  });

  it("retourne 400 quand le nom de l'opérateur est manquant", async () => {
    const request = new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify({ id: 1, operateur: { name: "" } }),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(400);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
    expect(mockCreateCpomEvent).not.toHaveBeenCalled();
  });
});
