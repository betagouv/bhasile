import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/structures/route";

const mockGetServerSession = vi.fn();
const mockCanUpdateStructure = vi.fn();
const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockGetAdresseAdministrativeCoordinates = vi.fn();
const mockCreateUserAction = vi.fn();

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
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
  getLatestPlacesAutoriseesPerStructure: vi.fn(),
  findBySearch: vi.fn(),
  countBySearch: vi.fn(),
}));

vi.mock("@/app/api/structures/structure.util", () => ({
  getAdresseAdministrativeCoordinates: (...args: unknown[]) =>
    mockGetAdresseAdministrativeCoordinates(...args),
}));

vi.mock("@/app/api/activites/activite.repository", () => ({
  getDepartementActivitesAverage: vi.fn(),
}));

vi.mock("@/app/api/user-action/user-action.repository", () => ({
  createUserAction: (...args: unknown[]) => mockCreateUserAction(...args),
}));

describe("PUT /api/structures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce(null);
    const request = new Request("http://localhost/api/structures", {
      method: "PUT",
      body: JSON.stringify({ id: 1 }),
    });

    // WHEN
    const response = await PUT(request as NextRequest);

    // THEN
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Non authentifié" });
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("should return 403 when user has insufficient rights", async () => {
    // GIVEN
    const parsedBody = { id: 2 };
    const session = { user: { id: 1 } };
    const existingStructure = { id: 2 };

    mockGetServerSession.mockResolvedValueOnce(session);
    mockFindOne.mockResolvedValueOnce(existingStructure);
    mockCanUpdateStructure.mockReturnValueOnce(false);

    const request = new Request("http://localhost/api/structures", {
      method: "PUT",
      body: JSON.stringify(parsedBody),
    });

    // WHEN
    const response = await PUT(request as NextRequest);

    // THEN
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Droits insuffisants" });
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it("should return 201 and call repository with enriched payload", async () => {
    // GIVEN
    const parsedBody = { id: 3 };
    const session = { user: { id: 1 } };
    const coordinates = { latitude: 48.86, longitude: 2.34 };
    const updatedStructure = { id: 3 };

    mockGetServerSession.mockResolvedValueOnce(session);
    mockFindOne.mockResolvedValueOnce({ id: 3 });
    mockCanUpdateStructure.mockReturnValueOnce(true);
    mockGetAdresseAdministrativeCoordinates.mockResolvedValueOnce(coordinates);
    mockUpdateOne.mockResolvedValueOnce(updatedStructure);

    const request = new Request("http://localhost/api/structures", {
      method: "PUT",
      body: JSON.stringify(parsedBody),
    });

    // WHEN
    const response = await PUT(request as NextRequest);

    // THEN
    expect(response.status).toBe(201);
    expect(await response.json()).toBe("Structure mise à jour avec succès");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      {
        ...parsedBody,
        ...coordinates,
      },
      false
    );
    expect(mockCreateUserAction).toHaveBeenCalledWith({
      method: "PUT",
      structureId: 3,
    });
  });

  it("should return 400 when payload does not match schema", async () => {
    // GIVEN
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 1 } });

    const request = new Request("http://localhost/api/structures", {
      method: "PUT",
      body: JSON.stringify({ id: "invalid-id" }),
    });

    // WHEN
    const response = await PUT(request as NextRequest);

    // THEN
    expect(response.status).toBe(400);
    expect(mockFindOne).not.toHaveBeenCalled();
    expect(mockUpdateOne).not.toHaveBeenCalled();
    expect(mockCreateUserAction).not.toHaveBeenCalled();
  });
});
