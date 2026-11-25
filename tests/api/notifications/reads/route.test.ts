import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/notifications/reads/route";
import { DomainError } from "@/app/utils/domain-error.util";

const mockGetServerSession = vi.fn();
const mockMarkNotificationRead = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/notifications/notification.service", () => ({
  markNotificationRead: (...args: unknown[]) =>
    mockMarkNotificationRead(...args),
}));

const buildRequest = (body: unknown): NextRequest =>
  new NextRequest("http://localhost/api/notifications/reads", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/notifications/reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "agent@gouv.fr" },
    });
  });

  it("écrit la lecture du fait et ne renvoie rien", async () => {
    const response = await POST(buildRequest({ eventId: 5 }));

    expect(response.status).toBe(204);
    expect(mockMarkNotificationRead).toHaveBeenCalledWith(
      { email: "agent@gouv.fr" },
      5
    );
  });

  it("répond 404 pour un fait qui n'est pas une notification de l'utilisateur", async () => {
    mockMarkNotificationRead.mockRejectedValueOnce(
      new DomainError("Notification introuvable", 404)
    );

    const response = await POST(buildRequest({ eventId: 5 }));

    expect(response.status).toBe(404);
  });

  it("rejette un identifiant de fait invalide", async () => {
    const response = await POST(buildRequest({ eventId: "cinq" }));

    expect(response.status).toBe(400);
    expect(mockMarkNotificationRead).not.toHaveBeenCalled();
  });
});
