import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "@/app/api/tarifications/messages/[messageId]/route";

const mockGetServerSession = vi.fn();
const mockChangeTarificationMessageTag = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/tarifications/tarification.service", () => ({
  changeTarificationMessageTag: (...args: unknown[]) =>
    mockChangeTarificationMessageTag(...args),
}));

const sessionUser = { email: "agent@gouv.fr" };
const params = Promise.resolve({ messageId: "9" });

const buildRequest = (body: unknown): NextRequest =>
  new NextRequest("http://localhost/api/tarifications/messages/9", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

describe("PATCH /api/tarifications/messages/[messageId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: sessionUser });
    mockChangeTarificationMessageTag.mockResolvedValue({ id: 9, tagKey: null });
  });

  it("refuse un utilisateur non authentifié", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await PATCH(buildRequest({ tagKey: "L48" }), { params });

    expect(response.status).toBe(401);
  });

  it("exige un tag explicite, éventuellement nul", async () => {
    const response = await PATCH(buildRequest({}), { params });

    expect(response.status).toBe(400);
  });

  it("retire le tag d'un message", async () => {
    const response = await PATCH(buildRequest({ tagKey: null }), { params });

    expect(response.status).toBe(200);
    expect(mockChangeTarificationMessageTag).toHaveBeenCalledWith({
      messageId: 9,
      tagKey: null,
      user: sessionUser,
    });
  });
});
