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

const put = (newCategory: string) =>
  PUT(
    new NextRequest("http://localhost/api/faq/categories", {
      method: "PUT",
      body: JSON.stringify({ category: "Structures", newCategory }),
    })
  );

describe("PUT /api/faq/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: createSessionUser({ isSuperAdmin: true }),
    });
  });

  it("refuse un agent qui n'est pas super admin", async () => {
    mockGetServerSession.mockResolvedValue({ user: createNationalAgent() });

    expect((await put("Fiches")).status).toBe(403);
    expect(mockRenameFaqCategory).not.toHaveBeenCalled();
  });

  it("rejette un nouveau nom vide", async () => {
    expect((await put(" ")).status).toBe(400);
    expect(mockRenameFaqCategory).not.toHaveBeenCalled();
  });

  it("renomme la catégorie", async () => {
    expect((await put("Fiches")).status).toBe(200);
    expect(mockRenameFaqCategory).toHaveBeenCalledWith({
      category: "Structures",
      newCategory: "Fiches",
    });
  });
});
