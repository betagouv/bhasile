import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/cpoms/[id]/route";

const mockGetServerSession = vi.fn();
const mockCanSaveCpom = vi.fn();
const mockFindOne = vi.fn();
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
  findOne: (...args: unknown[]) => mockFindOne(...args),
  findCpomScope: (...args: unknown[]) => mockFindCpomScope(...args),
  createOrUpdateCpom: (...args: unknown[]) => mockCreateOrUpdateCpom(...args),
}));

vi.mock("@/app/api/user-actions/user-action.service", () => ({
  createCpomEvent: (...args: unknown[]) => mockCreateCpomEvent(...args),
}));

describe("PUT /api/cpoms/[id]", () => {
  const cpomScope = {
    departements: [{ departement: { numero: "13" } }],
    structures: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "agent" } });
    mockFindCpomScope.mockResolvedValue(cpomScope);
    mockCanSaveCpom.mockReturnValue(true);
  });

  it("retourne 200 avec le cpomId en cas de succès", async () => {
    // GIVEN
    mockCreateOrUpdateCpom.mockResolvedValueOnce(2);

    const request = new Request("http://localhost/api/cpoms/1", {
      method: "PUT",
      body: JSON.stringify({ operateur: { name: "Opérateur Test" } }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cpomId: 2 });
    expect(mockCreateCpomEvent).toHaveBeenCalledWith("PUT", 2);
    expect(mockCreateOrUpdateCpom).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 })
    );
    expect(mockFindCpomScope).toHaveBeenCalledWith(1);
    expect(mockCanSaveCpom).toHaveBeenCalledWith(
      { id: "agent" },
      expect.objectContaining({ id: 1 }),
      cpomScope
    );
  });

  it("retourne 401 quand l'utilisateur n'est pas authentifié", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce(null);
    const request = new Request("http://localhost/api/cpoms/1", {
      method: "PUT",
      body: JSON.stringify({}),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(401);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
  });

  it("retourne 404 quand le CPOM est introuvable", async () => {
    // GIVEN
    mockFindCpomScope.mockResolvedValueOnce(null);
    const request = new Request("http://localhost/api/cpoms/1", {
      method: "PUT",
      body: JSON.stringify({}),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(404);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
  });

  it("retourne 403 quand l'utilisateur n'a pas les droits sur le CPOM", async () => {
    // GIVEN
    mockCanSaveCpom.mockReturnValueOnce(false);
    const request = new Request("http://localhost/api/cpoms/1", {
      method: "PUT",
      body: JSON.stringify({}),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(403);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
    expect(mockCreateCpomEvent).not.toHaveBeenCalled();
  });

  it("retourne 400 quand le corps de la requête est invalide", async () => {
    // GIVEN
    const request = new Request("http://localhost/api/cpoms/1", {
      method: "PUT",
      body: JSON.stringify({ operateur: { name: "" } }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(400);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
    expect(mockCreateCpomEvent).not.toHaveBeenCalled();
  });
});
