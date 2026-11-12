import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CockpitFeatureHeader } from "@/app/(authenticated)/(with-menu)/parametres/cockpit-admin/_components/CockpitFeatureHeader";

const mockPathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

vi.mock("@/components/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) => <h2>{title}</h2>,
}));

describe("CockpitFeatureHeader", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/parametres/cockpit-admin/faq");
  });

  it("reprend le titre de la fonctionnalité visitée depuis le registre", () => {
    render(<CockpitFeatureHeader />);

    expect(
      screen.getByRole("heading", { name: "Questions de la FAQ" })
    ).toBeInTheDocument();
  });

  it("ramène au cockpit admin", () => {
    render(<CockpitFeatureHeader />);

    expect(
      screen.getByRole("link", { name: "Retour au cockpit admin" })
    ).toHaveAttribute("href", "/parametres/cockpit-admin");
  });
});
