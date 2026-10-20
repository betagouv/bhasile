import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/cpoms/route";

const mockGetServerSession = vi.fn();
const mockCanSaveCpom = vi.fn();
const mockFindCpomScope = vi.fn();
const mockCreateOrUpdateCpom = vi.fn();
const mockCreateCpomEvent = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/casl/abilities", () => ({
  canSaveCpom: (...args: unknown[]) => mockCanSaveCpom(...args),
}));

vi.mock("@/app/api/cpoms/cpom.repository", () => ({
  findCpomScope: (...args: unknown[]) => mockFindCpomScope(...args),
  createOrUpdateCpom: (...args: unknown[]) => mockCreateOrUpdateCpom(...args),
}));

vi.mock("@/app/api/user-actions/user-action.service", () => ({
  createCpomEvent: (...args: unknown[]) => mockCreateCpomEvent(...args),
}));

describe("POST /api/cpoms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "agent" } });
    mockFindCpomScope.mockResolvedValue({ departements: [], structures: [] });
    mockCanSaveCpom.mockReturnValue(true);
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

  it("contrôle les droits sur le CPOM existant quand le payload porte un id", async () => {
    const existingCpom = {
      departements: [{ departement: { numero: "69" } }],
      structures: [],
    };
    mockFindCpomScope.mockResolvedValueOnce(existingCpom);
    mockCreateOrUpdateCpom.mockResolvedValueOnce(1);

    const request = new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify({ id: 1, operateur: { name: "Opérateur Test" } }),
    });

    await POST(request as NextRequest);

    expect(mockFindCpomScope).toHaveBeenCalledWith(1);
    expect(mockCanSaveCpom).toHaveBeenCalledWith(
      { id: "agent" },
      expect.objectContaining({ id: 1 }),
      existingCpom
    );
  });

  it("retourne 404 quand le payload porte l'id d'un CPOM introuvable", async () => {
    mockFindCpomScope.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify({ id: 1, operateur: { name: "Opérateur Test" } }),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(404);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
  });

  it("retourne 401 quand l'utilisateur n'est pas authentifié", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify({ operateur: { name: "Opérateur Test" } }),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(401);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
  });

  it("retourne 403 quand l'utilisateur n'a pas les droits sur le CPOM", async () => {
    mockCanSaveCpom.mockReturnValueOnce(false);

    const request = new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify({ operateur: { name: "Opérateur Test" } }),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(403);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
    expect(mockCreateCpomEvent).not.toHaveBeenCalled();
  });
});
