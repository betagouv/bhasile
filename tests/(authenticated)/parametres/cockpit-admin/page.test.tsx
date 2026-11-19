import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { COCKPIT_SECTIONS } from "@/app/(authenticated)/(with-menu)/parametres/cockpit-admin/cockpit-admin.features";
import CockpitAdmin from "@/app/(authenticated)/(with-menu)/parametres/cockpit-admin/page";

vi.mock("@/components/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) => <h2>{title}</h2>,
}));

describe("CockpitAdmin", () => {
  it("affiche chaque fonctionnalité du registre dans sa section", () => {
    render(<CockpitAdmin />);

    for (const section of COCKPIT_SECTIONS) {
      const sectionElement = screen.getByRole("heading", {
        name: section.title,
      }).parentElement as HTMLElement;
      for (const feature of section.features) {
        expect(
          within(sectionElement).getByRole("heading", { name: feature.title })
        ).toBeInTheDocument();
      }
    }
  });

  it("attribue une adresse distincte à chaque fonctionnalité", () => {
    const hrefs = COCKPIT_SECTIONS.flatMap((section) =>
      section.features.map((feature) => feature.href)
    );

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
