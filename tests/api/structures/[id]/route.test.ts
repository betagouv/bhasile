import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/structures/[id]/route";

const mockGetServerSession = vi.fn();
const mockCanUpdateStructure = vi.fn();
const mockFindOne = vi.fn();
const mockFindOneOperateur = vi.fn();
const mockUpdateOne = vi.fn();
const mockCreateStructureEvent = vi.fn();
const mockGetDepartementActivitesAverage = vi.fn();
const mockGetAdresseAdministrativeCoordinates = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/casl/abilities", () => ({
  canUpdateStructure: (...args: unknown[]) => mockCanUpdateStructure(...args),
}));

vi.mock("@/app/api/structures/structure.repository", () => ({
  findOne: (...args: unknown[]) => mockFindOne(...args),
  findOneOperateur: (...args: unknown[]) => mockFindOneOperateur(...args),
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
}));

vi.mock("@/app/api/activites/activite.repository", () => ({
  getDepartementActivitesAverage: (...args: unknown[]) =>
    mockGetDepartementActivitesAverage(...args),
}));

vi.mock("@/app/api/activites/activite.service", () => ({
  processActivitesForStructure: vi.fn().mockReturnValue([]),
}));

vi.mock("@/app/api/structures/structure.util", () => ({
  getAdresseAdministrativeCoordinates: (...args: unknown[]) =>
    mockGetAdresseAdministrativeCoordinates(...args),
  getCpomStructuresWithDates: vi.fn().mockReturnValue([]),
  getCurrentPlacesAutorisees: vi.fn().mockReturnValue(10),
  getCurrentPlacesLogementsSociaux: vi.fn().mockReturnValue(2),
  getCurrentPlacesQpv: vi.fn().mockReturnValue(3),
  getOperateurLabel: vi.fn().mockReturnValue("Adoma"),
  getRepartition: vi.fn().mockReturnValue("DIFFUS"),
  isStructureInCpom: vi.fn().mockReturnValue(false),
  isStructureInCpomPerYear: vi.fn().mockReturnValue({}),
  getDatesConvention: vi.fn().mockReturnValue([null, null]),
  getDatesPeriodeAutorisation: vi.fn().mockReturnValue([null, null]),
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
    const dbStructure = {
      id: 1,
      name: "Test",
      filiale: null,
      operateur: { id: 1, name: "Adoma" },
      type: "CADA",
      adresses: [],
      cpomStructures: [],
      creationDate: new Date("2020-01-01"),
      date303: null,
      dnaStructures: [],
      latitude: 48.86,
      longitude: 2.34,
    };
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindOne.mockResolvedValueOnce(dbStructure);

    const request = new NextRequest("http://localhost/api/structures/1");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 1,
      name: "Test",
      filiale: null,
      operateur: { id: 1, name: "Adoma" },
      type: "CADA",
      adresses: [],
      cpomStructures: [],
      creationDate: "2020-01-01T00:00:00.000Z",
      date303: null,
      debutConvention: null,
      finConvention: null,
      debutPeriodeAutorisation: null,
      finPeriodeAutorisation: null,
      dnaStructures: [],
      latitude: "48.86",
      longitude: "2.34",
      activites: [],
      evenementsIndesirablesGraves: [],
      repartition: "DIFFUS",
      operateurLabel: "Adoma",
      isAutorisee: true,
      isSubventionnee: false,
      currentPlaces: {
        placesAutorisees: 10,
        qpv: 3,
        logementsSociaux: 2,
      },
      isInCpom: false,
      isInCpomPerYear: {},
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

  it("should return 404 when structure is not found", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });
    mockFindOne.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost/api/structures/999");

    // WHEN
    const response = await GET(request);

    // THEN
    expect(response.status).toBe(404);
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

describe("PUT /api/structures/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce(null);
    const request = new Request("http://localhost/api/structures/1", {
      method: "PUT",
      body: JSON.stringify({ id: 1 }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "1" }),
    });

    // THEN
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Non authentifié" });
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("should return 403 when user has insufficient rights", async () => {
    // GIVEN
    const session = { user: { id: 1 } };
    const existingStructure = { id: 2 };

    mockGetServerSession.mockResolvedValueOnce(session);
    mockFindOne.mockResolvedValueOnce(existingStructure);
    mockCanUpdateStructure.mockReturnValueOnce(false);

    const request = new Request("http://localhost/api/structures/2", {
      method: "PUT",
      body: JSON.stringify({ id: 2 }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "2" }),
    });

    // THEN
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Droits insuffisants" });
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("should return 200 and call repository with enriched payload", async () => {
    // GIVEN
    const session = { user: { id: 1 } };
    const coordinates = { latitude: 48.86, longitude: 2.34 };
    const updatedStructure = { id: 3 };

    mockGetServerSession.mockResolvedValueOnce(session);
    mockFindOne.mockResolvedValueOnce({ id: 3 });
    mockCanUpdateStructure.mockReturnValueOnce(true);
    mockGetAdresseAdministrativeCoordinates.mockResolvedValueOnce(coordinates);
    mockUpdateOne.mockResolvedValueOnce(updatedStructure);

    const request = new Request("http://localhost/api/structures/3", {
      method: "PUT",
      body: JSON.stringify({ id: 3 }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "3" }),
    });

    // THEN
    expect(response.status).toBe(200);
    expect(await response.json()).toBe("Structure mise à jour avec succès");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, ...coordinates }),
      false
    );
  });

  it("should return 400 when payload does not match schema", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });

    const request = new Request("http://localhost/api/structures/abc", {
      method: "PUT",
      body: JSON.stringify({ id: "invalid" }),
    });

    // WHEN
    const response = await PUT(request as NextRequest, {
      params: Promise.resolve({ id: "abc" }),
    });

    // THEN
    expect(response.status).toBe(400);
    expect(mockFindOne).not.toHaveBeenCalled();
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });
});
