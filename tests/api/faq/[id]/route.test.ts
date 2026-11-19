import { NextRequest } from "next/server";
import { createFaqItemValues } from "tests/test-utils/factories/faq.factory";
import {
  createNationalAgent,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PUT } from "@/app/api/faq/[id]/route";

const mockGetServerSession = vi.fn();
const mockEditFaqItem = vi.fn();
const mockRemoveFaqItem = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/faq/faq.service", () => ({
  editFaqItem: (...args: unknown[]) => mockEditFaqItem(...args),
  removeFaqItem: (...args: unknown[]) => mockRemoveFaqItem(...args),
}));

const put = (id: string) =>
  PUT(
    new NextRequest(`http://localhost/api/faq/${id}`, {
      method: "PUT",
      body: JSON.stringify(createFaqItemValues()),
    }),
    { params: Promise.resolve({ id }) }
  );

const remove = (id: string) =>
  DELETE(
    new NextRequest(`http://localhost/api/faq/${id}`, { method: "DELETE" }),
    { params: Promise.resolve({ id }) }
  );

describe("/api/faq/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: createSessionUser({ isSuperAdmin: true }),
    });
  });

  it.each([
    ["PUT", put],
    ["DELETE", remove],
  ])("refuse %s à un agent qui n'est pas super admin", async (_, call) => {
    mockGetServerSession.mockResolvedValue({ user: createNationalAgent() });

    expect((await call("3")).status).toBe(403);
    expect(mockEditFaqItem).not.toHaveBeenCalled();
    expect(mockRemoveFaqItem).not.toHaveBeenCalled();
  });

  it("renvoie une 404 pour un identifiant invalide", async () => {
    expect((await put("abc")).status).toBe(404);
    expect(mockEditFaqItem).not.toHaveBeenCalled();
  });

  it("met à jour la question", async () => {
    expect((await put("3")).status).toBe(200);
    expect(mockEditFaqItem).toHaveBeenCalledWith(3, createFaqItemValues());
  });

  it("supprime la question", async () => {
    expect((await remove("3")).status).toBe(200);
    expect(mockRemoveFaqItem).toHaveBeenCalledWith(3);
  });
});
