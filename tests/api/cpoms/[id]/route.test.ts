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

vi.mock("@/lib/casl", () => ({
  canSaveCpom: (...args: unknown[]) => mockCanSaveCpom(...args),
}));

vi.mock("@/app/api/cpoms/cpom.repository", () => ({
  findOne: (...args: unknown[]) => mockFindOne(...args),
  findCpomScope: (...args: unknown[]) => mockFindCpomScope(...args),
  createOrUpdateCpom: (...args: unknown[]) => mockCreateOrUpdateCpom(...args),
}));

vi.mock("@/app/api/regions/region.repository", () => ({
  findRegionIdByName: vi.fn(),
}));

vi.mock("@/app/api/user-actions/user-action.service", () => ({
  createCpomEvent: (...args: unknown[]) => mockCreateCpomEvent(...args),
}));

const putCpom = (body: object) =>
  PUT(
    new Request("http://localhost/api/cpoms/1", {
      method: "PUT",
      body: JSON.stringify(body),
    }) as NextRequest,
    { params: Promise.resolve({ id: "1" }) }
  );

describe("PUT /api/cpoms/[id]", () => {
  const cpomScope = {
    operateurId: 3,
    granularity: "DEPARTEMENTALE",
    regionId: null,
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
    mockCreateOrUpdateCpom.mockResolvedValueOnce(2);

    const response = await putCpom({ operateur: { name: "Opérateur Test" } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cpomId: 2 });
    expect(mockCreateCpomEvent).toHaveBeenCalledWith("PUT", 2);
    expect(mockCreateOrUpdateCpom).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 })
    );
    expect(mockCanSaveCpom).toHaveBeenCalledWith(
      { id: "agent" },
      expect.objectContaining({ id: 1 }),
      cpomScope
    );
  });

  it.each([
    {
      status: 400,
      cas: "le corps de la requête est invalide",
      body: { operateur: { name: "" } },
    },
    {
      status: 401,
      cas: "l'utilisateur n'est pas authentifié",
      setup: () => mockGetServerSession.mockResolvedValueOnce(null),
    },
    {
      status: 403,
      cas: "l'utilisateur n'a pas les droits sur le CPOM",
      setup: () => mockCanSaveCpom.mockReturnValueOnce(false),
    },
    {
      status: 404,
      cas: "le CPOM est introuvable",
      setup: () => mockFindCpomScope.mockResolvedValueOnce(null),
    },
  ])("retourne $status quand $cas", async ({ status, body, setup }) => {
    setup?.();

    const response = await putCpom(body ?? {});

    expect(response.status).toBe(status);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
    expect(mockCreateCpomEvent).not.toHaveBeenCalled();
  });
});
