import { NextRequest } from "next/server";
import {
  createNationalAgent,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/agents/[id]/route";
import { POST as addAgentRoute } from "@/app/api/agents/route";
import { POST as addPerimeterRoute } from "@/app/api/perimeters/route";

const mockGetServerSession = vi.fn();
const mockAddAgent = vi.fn();
const mockUpdateAgentAccess = vi.fn();
const mockAddPerimeter = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/agents/agent.service", () => ({
  addAgent: (...args: unknown[]) => mockAddAgent(...args),
  updateAgentAccess: (...args: unknown[]) => mockUpdateAgentAccess(...args),
}));

vi.mock("@/app/api/perimeters/perimeter.service", () => ({
  addPerimeter: (...args: unknown[]) => mockAddPerimeter(...args),
}));

const request = (url: string, method: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    body: JSON.stringify(body),
  });

const updateAccess = (id: string, body: unknown) =>
  PUT(request(`/api/agents/${id}`, "PUT", body), {
    params: Promise.resolve({ id }),
  });

describe("routes agents et périmètres", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: createSessionUser({ isSuperAdmin: true }),
    });
  });

  it.each([
    [
      "l'ajout d'un agent",
      () =>
        addAgentRoute(
          request("/api/agents", "POST", { email: "a@gouv.fr", perimeterId: 3 })
        ),
    ],
    [
      "la mise à jour d'un accès",
      () => updateAccess("12", { status: "DEACTIVATED" }),
    ],
    [
      "la création d'un périmètre",
      () =>
        addPerimeterRoute(
          request("/api/perimeters", "POST", {
            scope: "REGION",
            regionId: 5,
            name: "DREETS Bretagne",
          })
        ),
    ],
  ])("refuse %s à un agent qui n'est pas super admin", async (_, call) => {
    mockGetServerSession.mockResolvedValue({ user: createNationalAgent() });

    expect((await call()).status).toBe(403);
    expect(mockAddAgent).not.toHaveBeenCalled();
    expect(mockUpdateAgentAccess).not.toHaveBeenCalled();
    expect(mockAddPerimeter).not.toHaveBeenCalled();
  });

  it("ajoute un agent avec son email normalisé", async () => {
    const response = await addAgentRoute(
      request("/api/agents", "POST", {
        email: " Agent@Finistere.gouv.fr ",
        perimeterId: 3,
      })
    );

    expect(response.status).toBe(201);
    expect(mockAddAgent).toHaveBeenCalledWith(
      { email: "agent@finistere.gouv.fr", perimeterId: 3 },
      "POST"
    );
  });

  it("refuse de valider un agent sans périmètre", async () => {
    expect((await updateAccess("12", { status: "ACTIVATED" })).status).toBe(
      400
    );
    expect(mockUpdateAgentAccess).not.toHaveBeenCalled();
  });

  it("transmet la validation d'un agent au service", async () => {
    const response = await updateAccess("12", {
      status: "ACTIVATED",
      perimeterId: 3,
    });

    expect(response.status).toBe(200);
    expect(mockUpdateAgentAccess).toHaveBeenCalledWith(
      12,
      { status: "ACTIVATED", perimeterId: 3 },
      "PUT"
    );
  });
});
