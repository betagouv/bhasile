import { NextRequest } from "next/server";
import {
  createNationalAgent,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/faq/categories/route";

const mockGetServerSession = vi.fn();
const mockRenameFaqCategory = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/faq/faq.service", () => ({
  renameFaqCategory: (...args: unknown[]) => mockRenameFaqCategory(...args),
}));

const buildRequest = (body: unknown): NextRequest =>
  new NextRequest("http://localhost/api/faq/categories", {
    method: "PUT",
    body: JSON.stringify(body),
  });

describe("PUT /api/faq/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: createSessionUser({ isSuperAdmin: true }),
    });
  });

  it("refuse un agent qui n'est pas super admin", async () => {
    mockGetServerSession.mockResolvedValue({ user: createNationalAgent() });

    const response = await PUT(
      buildRequest({ category: "Structures", newCategory: "Fiches" })
    );

    expect(response.status).toBe(403);
    expect(mockRenameFaqCategory).not.toHaveBeenCalled();
  });

  it("rejette un nouveau nom vide", async () => {
    const response = await PUT(
      buildRequest({ category: "Structures", newCategory: " " })
    );

    expect(response.status).toBe(400);
    expect(mockRenameFaqCategory).not.toHaveBeenCalled();
  });

  it("renomme la catégorie, débarrassée des espaces superflus", async () => {
    const response = await PUT(
      buildRequest({ category: "Structures", newCategory: " Fiches " })
    );

    expect(response.status).toBe(200);
    expect(mockRenameFaqCategory).toHaveBeenCalledWith({
      category: "Structures",
      newCategory: "Fiches",
    });
  });
});
