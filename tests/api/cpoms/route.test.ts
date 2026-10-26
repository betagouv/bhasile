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

vi.mock("@/lib/casl", () => ({
  canSaveCpom: (...args: unknown[]) => mockCanSaveCpom(...args),
}));

vi.mock("@/app/api/cpoms/cpom.repository", () => ({
  findCpomScope: (...args: unknown[]) => mockFindCpomScope(...args),
  createOrUpdateCpom: (...args: unknown[]) => mockCreateOrUpdateCpom(...args),
}));

vi.mock("@/app/api/user-actions/user-action.service", () => ({
  createCpomEvent: (...args: unknown[]) => mockCreateCpomEvent(...args),
}));

const payload = {
  granularity: "DEPARTEMENTALE",
  operateur: { name: "Opérateur Test" },
};

const postCpom = (body: object) =>
  POST(
    new Request("http://localhost/api/cpoms", {
      method: "POST",
      body: JSON.stringify(body),
    }) as NextRequest
  );

describe("POST /api/cpoms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "agent" } });
    mockFindCpomScope.mockResolvedValue({
      granularity: "DEPARTEMENTALE",
      regionId: null,
      departements: [],
      structures: [],
    });
    mockCanSaveCpom.mockReturnValue(true);
  });

  it("retourne 201 avec le cpomId en cas de succès", async () => {
    mockCreateOrUpdateCpom.mockResolvedValueOnce(1);

    const response = await postCpom(payload);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ cpomId: 1 });
    expect(mockCreateCpomEvent).toHaveBeenCalledWith("POST", 1);
  });

  it("contrôle les droits sur le CPOM existant quand le payload porte un id", async () => {
    const existingCpom = {
      granularity: "DEPARTEMENTALE",
      regionId: null,
      departements: [{ departement: { numero: "69" } }],
      structures: [],
    };
    mockFindCpomScope.mockResolvedValueOnce(existingCpom);

    await postCpom({ ...payload, id: 1 });

    expect(mockCanSaveCpom).toHaveBeenCalledWith(
      { id: "agent" },
      expect.objectContaining({ id: 1 }),
      existingCpom
    );
  });

  it.each([
    {
      status: 400,
      cas: "le nom de l'opérateur est manquant",
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
      cas: "le payload porte l'id d'un CPOM introuvable",
      body: { ...payload, id: 1 },
      setup: () => mockFindCpomScope.mockResolvedValueOnce(null),
    },
  ])("retourne $status quand $cas", async ({ status, body, setup }) => {
    setup?.();

    const response = await postCpom(body ?? payload);

    expect(response.status).toBe(status);
    expect(mockCreateOrUpdateCpom).not.toHaveBeenCalled();
    expect(mockCreateCpomEvent).not.toHaveBeenCalled();
  });
});
