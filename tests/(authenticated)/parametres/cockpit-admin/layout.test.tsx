import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CockpitAdminLayout from "@/app/(authenticated)/(with-menu)/parametres/cockpit-admin/layout";

const mockGetServerSession = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

const renderLayout = async () =>
  render(await CockpitAdminLayout({ children: <div data-testid="cockpit" /> }));

describe("CockpitAdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le cockpit à un super admin", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "admin@test.fr", isSuperAdmin: true, grants: [] },
    });

    await renderLayout();

    expect(screen.getByTestId("cockpit")).toBeInTheDocument();
  });

  it("renvoie une 404 à un utilisateur qui n'est pas super admin", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "agent@test.fr", isSuperAdmin: false, grants: [] },
    });

    await expect(renderLayout()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renvoie une 404 sans session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(renderLayout()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
