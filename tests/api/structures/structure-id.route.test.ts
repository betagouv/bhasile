import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/structures/[id]/route";

const mockGetServerSession = vi.fn();
const mockFindOne = vi.fn();
const mockFindOneOperateur = vi.fn();
const mockCreateStructureEvent = vi.fn();
const mockGetDepartementActivitesAverage = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

vi.mock("@/app/api/structures/structure.repository", () => ({
  findOne: (...args: unknown[]) => mockFindOne(...args),
  findOneOperateur: (...args: unknown[]) => mockFindOneOperateur(...args),
}));

vi.mock("@/app/api/activites/activite.repository", () => ({
  getDepartementActivitesAverage: (...args: unknown[]) =>
    mockGetDepartementActivitesAverage(...args),
}));

vi.mock("@/app/api/user-action/user-action.service", () => ({
  createStructureEvent: (...args: unknown[]) =>
    mockCreateStructureEvent(...args),
}));

describe("GET /api/structures/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return full structure when authenticated", async () => {
    // GIVEN
    const structure = {
      id: 1,
      name: "Test",
      filiale: null,
      operateur: { name: "Adoma" },
      type: "CADA",
      adresses: [],
      cpomStructures: [],
      creationDate: new Date("2020-01-01"),
      date303: null,
      dnaStructures: [],
      latitude: null,
      longitude: null,
    };
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindOne.mockResolvedValueOnce(structure);

    const request = new NextRequest("http://localhost/api/structures/1");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: 1,
      name: "Test",
      operateurLabel: "Adoma",
    });
    expect(mockFindOne).toHaveBeenCalledWith(1);
    expect(mockFindOneOperateur).not.toHaveBeenCalled();
  });

  it("should return limited structure when not authenticated", async () => {
    // GIVEN
    const structure = { id: 1 };
    mockGetServerSession.mockResolvedValueOnce(null);
    mockFindOneOperateur.mockResolvedValueOnce(structure);

    const request = new NextRequest("http://localhost/api/structures/1");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(structure);
    expect(mockFindOneOperateur).toHaveBeenCalledWith(1);
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it("should return 500 when structure is not found", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindOne.mockRejectedValueOnce(new Error("Not found"));

    const request = new NextRequest("http://localhost/api/structures/999");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(500);
    expect(mockCreateStructureEvent).not.toHaveBeenCalled();
  });

  it("should return 500 when service throws", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindOne.mockRejectedValueOnce(new Error("Database error"));

    const request = new NextRequest("http://localhost/api/structures/1");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(500);
    expect(mockFindOne).toHaveBeenCalledWith(1);
  });
});
