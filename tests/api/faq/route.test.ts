import { NextRequest } from "next/server";
import { createFaqItemValues } from "tests/test-utils/factories/faq.factory";
import {
  createNationalAgent,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/faq/route";

const mockGetServerSession = vi.fn();
const mockAddFaqItem = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/faq/faq.service", () => ({
  addFaqItem: (...args: unknown[]) => mockAddFaqItem(...args),
}));

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/faq", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );

describe("POST /api/faq", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: createSessionUser({ isSuperAdmin: true }),
    });
  });

  it("refuse un agent qui n'est pas super admin", async () => {
    mockGetServerSession.mockResolvedValue({ user: createNationalAgent() });

    expect((await post(createFaqItemValues())).status).toBe(403);
    expect(mockAddFaqItem).not.toHaveBeenCalled();
  });

  it("rejette une question vide", async () => {
    expect((await post(createFaqItemValues({ question: " " }))).status).toBe(
      400
    );
    expect(mockAddFaqItem).not.toHaveBeenCalled();
  });

  it("crée la question, débarrassée des espaces superflus", async () => {
    const response = await post(
      createFaqItemValues({ category: " Structures " })
    );

    expect(response.status).toBe(201);
    expect(mockAddFaqItem).toHaveBeenCalledWith(createFaqItemValues());
  });
});
