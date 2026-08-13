import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/structures/route";
import { UserActionCategory } from "@/generated/prisma/enums";
import { PublicType } from "@/types/structure.type";

import { createStructure } from "../../test-utils/structure.factory";

const mockfindAllStructures = vi.fn();
const mockFindStructuresByIds = vi.fn();
const mockUpdateOne = vi.fn();
const mockGetAdresseAdministrativeCoordinates = vi.fn();
const mockCreateUserAction = vi.fn();
const mockGetServerSession = vi.fn();
const mockFilterStructureRows = vi.fn((...args: unknown[]) => args[0]);

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

vi.mock("@/app/api/anomalies/anomalie.service", () => ({
  recomputeAnomaliesSafely: vi.fn(),
}));

vi.mock("@/app/api/structures/structure.repository", () => ({
  updateOne: (...args: unknown[]) => mockUpdateOne(...args),
  findAllStructures: (...args: unknown[]) => mockfindAllStructures(...args),
  findStructuresByIds: (...args: unknown[]) => mockFindStructuresByIds(...args),
  findOneOperateur: vi.fn(),
}));

vi.mock("@/app/api/structures/structure.util", () => ({
  getAdresseAdministrativeCoordinates: (...args: unknown[]) =>
    mockGetAdresseAdministrativeCoordinates(...args),
  getCurrentPlacesAutorisees: vi.fn().mockReturnValue(0),
  getCurrentPlacesLogementsSociaux: vi.fn().mockReturnValue(0),
  getCurrentPlacesQpv: vi.fn().mockReturnValue(0),
  getOperateurLabel: vi.fn().mockReturnValue(""),
  getTypeBati: vi.fn().mockReturnValue("DIFFUS"),
  isStructureInCpom: vi.fn().mockReturnValue(false),
  isStructureInCpomPerYear: vi.fn().mockReturnValue({}),
  computeStructureListRow: vi.fn(),
  filterStructureRows: (...args: unknown[]) => mockFilterStructureRows(...args),
  sortStructureRows: vi.fn((rows: unknown[]) => rows),
  isStructureClosed: vi.fn().mockReturnValue(false),
  isStructureFinalised: vi.fn().mockReturnValue(false),
}));

vi.mock("@/app/api/user-actions/user-action.repository", () => ({
  createUserAction: (...args: unknown[]) => mockCreateUserAction(...args),
}));

describe("GET /api/structures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne les structures et leur total", async () => {
    // GIVEN
    mockfindAllStructures.mockResolvedValueOnce([]);
    mockFindStructuresByIds.mockResolvedValueOnce([]);

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

  // Les noms des query params sont le contrat avec le front : `closed` et
  // `finalised` côté URL, `isClosed` et `isFinalised` côté code.
  it("traduit les query params closed et finalised en filtres de recherche", async () => {
    mockfindAllStructures.mockResolvedValueOnce([]);
    mockFindStructuresByIds.mockResolvedValueOnce([]);

    const request = new NextRequest(
      "http://localhost/api/structures?closed=true&finalised=true"
    );

    await GET(request);

    expect(mockFilterStructureRows).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ isClosed: true, isFinalised: true }),
      expect.anything()
    );
  });

  it("laisse les filtres closed et finalised à faux quand les query params sont absents", async () => {
    mockfindAllStructures.mockResolvedValueOnce([]);
    mockFindStructuresByIds.mockResolvedValueOnce([]);

    const request = new NextRequest("http://localhost/api/structures");

    await GET(request);

    expect(mockFilterStructureRows).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ isClosed: false, isFinalised: false }),
      expect.anything()
    );
  });
});

describe("POST /api/structures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 201 en cas de succès", async () => {
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
      action: UserActionCategory.CREATE,
      structureId: 1,
    });
  });

  it("retourne 400 quand le payload est invalide", async () => {
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
