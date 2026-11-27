import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/structures/route";
import { AccessRole } from "@/generated/prisma/enums";

import {
  createSessionGrant,
  createSessionUser,
} from "../../test-utils/factories/session-user.factory";

const mockfindAllStructures = vi.fn();
const mockFindStructuresByIds = vi.fn();
const mockGetServerSession = vi.fn();
const mockFilterStructureRows = vi.fn((...args: unknown[]) => args[0]);

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  findOperateurFiliales: vi.fn(async () => []),
}));

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
  findStructureVersionAdresses: vi.fn().mockResolvedValue([]),
  findAllStructures: (...args: unknown[]) => mockfindAllStructures(...args),
  findStructuresByIds: (...args: unknown[]) => mockFindStructuresByIds(...args),
}));

vi.mock("@/app/api/structures/structure.util", () => ({
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
      expect.anything(),
      expect.anything()
    );
  });

  it("limite la liste aux structures lisibles par l'utilisateur connecté", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: createSessionUser({
        grants: [
          createSessionGrant({
            role: AccessRole.LECTEUR,
            departementNumeros: ["83"],
          }),
        ],
      }),
    });
    mockfindAllStructures.mockResolvedValueOnce([]);
    mockFindStructuresByIds.mockResolvedValueOnce([]);

    await GET(new NextRequest("http://localhost/api/structures"));

    expect(mockfindAllStructures).toHaveBeenCalledWith({
      OR: [{ departementAdministratif: { in: ["83"] } }],
    });
  });

  it("laisse les filtres closed et finalised à faux quand les query params sont absents", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: createSessionUser({
        grants: [createSessionGrant({ departementNumeros: ["83"] })],
      }),
    });
    mockfindAllStructures.mockResolvedValueOnce([]);
    mockFindStructuresByIds.mockResolvedValueOnce([]);

    const request = new NextRequest("http://localhost/api/structures");

    await GET(request);

    expect(mockFilterStructureRows).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ isClosed: false, isFinalised: false }),
      expect.anything(),
      expect.anything()
    );
  });
});
