import { render, screen } from "@testing-library/react";
import {
  createNationalAgent,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { describe, expect, it, vi } from "vitest";

import CockpitAdminLayout from "@/app/(authenticated)/(with-menu)/parametres/cockpit-admin/layout";

const mockGetServerSession = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

const renderLayout = async () =>
  render(await CockpitAdminLayout({ children: <div data-testid="cockpit" /> }));

describe("CockpitAdminLayout", () => {
  it("affiche le cockpit à un super admin", async () => {
    mockGetServerSession.mockResolvedValue({
      user: createSessionUser({ isSuperAdmin: true }),
    });

    await renderLayout();

    expect(screen.getByTestId("cockpit")).toBeInTheDocument();
  });

  it.each([
    ["à un agent qui n'est pas super admin", { user: createNationalAgent() }],
    ["sans session", null],
  ])("renvoie une 404 %s", async (_, session) => {
    mockGetServerSession.mockResolvedValue(session);

    await expect(renderLayout()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
