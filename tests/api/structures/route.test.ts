import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/structures/route";
import { PublicType } from "@/types/structure.type";

import { createStructure } from "../../test-utils/structure.factory";

const mockFindBySearch = vi.fn();
const mockCountBySearch = vi.fn();
const mockUpdateOne = vi.fn();
const mockGetAdresseAdministrativeCoordinates = vi.fn();
const mockCreateUserAction = vi.fn();

vi.mock("@/app/api/structures/structure.repository", () => ({
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
  getLatestPlacesAutoriseesPerStructure: vi.fn(),
  findBySearch: (...args: unknown[]) => mockFindBySearch(...args),
  countBySearch: (...args: unknown[]) => mockCountBySearch(...args),
  findOneOperateur: vi.fn(),
}));

vi.mock("@/app/api/structures/structure.util", () => ({
  getAdresseAdministrativeCoordinates: (...args: unknown[]) =>
    mockGetAdresseAdministrativeCoordinates(...args),
  getCurrentPlacesAutorisees: vi.fn().mockReturnValue(0),
  getCurrentPlacesLogementsSociaux: vi.fn().mockReturnValue(0),
  getCurrentPlacesQpv: vi.fn().mockReturnValue(0),
  getOperateurLabel: vi.fn().mockReturnValue(""),
  getRepartition: vi.fn().mockReturnValue("DIFFUS"),
  isStructureInCpom: vi.fn().mockReturnValue(false),
  isStructureInCpomPerYear: vi.fn().mockReturnValue({}),
}));

vi.mock("@/app/api/activites/activite.repository", () => ({
  getDepartementActivitesAverage: vi.fn(),
}));

vi.mock("@/app/api/user-action/user-action.repository", () => ({
  createUserAction: (...args: unknown[]) => mockCreateUserAction(...args),
}));

describe("GET /api/structures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return structures and total", async () => {
    // GIVEN
    mockFindBySearch.mockResolvedValueOnce([]);
    mockCountBySearch.mockResolvedValueOnce(0);

    const request = new NextRequest("http://localhost/api/structures");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      structures: [],
      totalStructures: 0,
    });
  });
});

describe("POST /api/structures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 on success", async () => {
    // GIVEN
    const payload = {
      ...createStructure({ id: 1 }),
      public: PublicType.TOUT_PUBLIC,
    };
    mockGetAdresseAdministrativeCoordinates.mockResolvedValueOnce({});
    mockUpdateOne.mockResolvedValueOnce({ id: 1 });

    const request = new Request("http://localhost/api/structures", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // WHEN
    const response = await POST(request as NextRequest);

    // THEN
    expect(response.status).toBe(201);
    expect(await response.json()).toBe("Structure créée avec succès");
    expect(mockCreateUserAction).toHaveBeenCalledWith({
      method: "POST",
      structureId: 1,
    });
  });

  it("should return 400 when payload is invalid", async () => {
    // GIVEN
    const request = new Request("http://localhost/api/structures", {
      method: "POST",
      body: JSON.stringify({}),
    });

    // WHEN
    const response = await POST(request as NextRequest);

    // THEN
    expect(response.status).toBe(400);
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });
});

