import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/campaigns/route";

const mockGetServerSession = vi.fn();
const mockGetActualisationYear = vi.fn();
const mockGetStructureDepartement = vi.fn();
const mockSaveActualisationCampaign = vi.fn();
const mockCanUpdateDepartement = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: () => mockGetServerSession(),
}));
vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));
vi.mock("@/app/api/campaigns/campaign.util", () => ({
  getActualisationYear: () => mockGetActualisationYear(),
}));
vi.mock("@/app/api/structures/structure.service", () => ({
  getStructureDepartement: (...args: unknown[]) =>
    mockGetStructureDepartement(...args),
}));
vi.mock("@/app/api/campaigns/campaign.service", () => ({
  saveActualisationCampaign: (...args: unknown[]) =>
    mockSaveActualisationCampaign(...args),
}));
vi.mock("@/lib/casl/abilities", () => ({
  canUpdateDepartement: (...args: unknown[]) => mockCanUpdateDepartement(...args),
}));

const putRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/campaigns", {
    method: "PUT",
    body: JSON.stringify(body),
  });

const validBody = { structureId: 1, year: 2026 };

describe("PUT /api/campaigns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { email: "agent@x.fr" } });
    mockGetActualisationYear.mockReturnValue(2026);
    mockGetStructureDepartement.mockResolvedValue("75");
    mockCanUpdateDepartement.mockReturnValue(true);
    mockSaveActualisationCampaign.mockResolvedValue({ id: 10 });
  });

  it("rejette une requête non authentifiée (401)", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const response = await PUT(putRequest(validBody));

    expect(response.status).toBe(401);
    expect(mockSaveActualisationCampaign).not.toHaveBeenCalled();
  });

  it("rejette une année d'actualisation non ouverte (400)", async () => {
    const response = await PUT(putRequest({ structureId: 1, year: 2025 }));

    expect(response.status).toBe(400);
    expect(mockSaveActualisationCampaign).not.toHaveBeenCalled();
  });

  it("rejette un agent sans droit sur le département (403)", async () => {
    mockCanUpdateDepartement.mockReturnValueOnce(false);

    const response = await PUT(putRequest(validBody));

    expect(response.status).toBe(403);
    expect(mockSaveActualisationCampaign).not.toHaveBeenCalled();
  });

  it("enregistre la campagne et retourne 200", async () => {
    const response = await PUT(putRequest(validBody));

    expect(response.status).toBe(200);
    expect(mockSaveActualisationCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ structureId: 1, year: 2026 })
    );
    const body = await response.json();
    expect(body).toEqual({ id: 10 });
  });

  it("rejette un payload invalide via apiErrorResponse (400)", async () => {
    const response = await PUT(putRequest({ year: 2026 }));

    expect(response.status).toBe(400);
    expect(mockSaveActualisationCampaign).not.toHaveBeenCalled();
  });
});
