import { NextRequest } from "next/server";
import {
  createNationalAgent,
  createSessionGrant,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getCartographie } from "@/app/api/statistiques/cartographie/route";
import { GET as getStatistiques } from "@/app/api/statistiques/route";

const mockGetServerSession = vi.fn();
const mockGetStatistiques = vi.fn();
const mockGetCartographieStatistiques = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({
  authOptions: {},
}));

vi.mock("@/app/api/statistiques/statistique.service", () => ({
  getStatistiques: (...args: unknown[]) => mockGetStatistiques(...args),
}));

vi.mock("@/app/api/statistiques/cartographie/cartographie.service", () => ({
  getCartographieStatistiques: (...args: unknown[]) =>
    mockGetCartographieStatistiques(...args),
}));

const operateurUser = createSessionUser({
  operateurId: 42,
  isAgent: false,
  grants: [createSessionGrant({ isNational: true })],
});

const routes = [
  {
    name: "GET /api/statistiques",
    call: () =>
      getStatistiques(new NextRequest("http://localhost/api/statistiques")),
    service: mockGetStatistiques,
  },
  {
    name: "GET /api/statistiques/cartographie",
    call: () =>
      getCartographie(
        new NextRequest(
          "http://localhost/api/statistiques/cartographie?granularite=region&indicateur=structures.total&annee=2025"
        )
      ),
    service: mockGetCartographieStatistiques,
  },
];

describe.each(routes)("$name", ({ call, service }) => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.mockResolvedValue({});
  });

  it("refuse un utilisateur non connecté", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await call();

    expect(response.status).toBe(401);
    expect(service).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur opérateur", async () => {
    mockGetServerSession.mockResolvedValue({ user: operateurUser });

    const response = await call();

    expect(response.status).toBe(403);
    expect(service).not.toHaveBeenCalled();
  });

  it("répond à un agent", async () => {
    mockGetServerSession.mockResolvedValue({ user: createNationalAgent() });

    const response = await call();

    expect(response.status).toBe(200);
    expect(service).toHaveBeenCalled();
  });
});
