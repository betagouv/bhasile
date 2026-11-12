import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CockpitFeatureTile } from "@/app/(authenticated)/(with-menu)/parametres/cockpit-admin/_components/CockpitFeatureTile";
import { CockpitFeature } from "@/types/cockpit-admin.type";

const feature: CockpitFeature = {
  title: "Import OFII",
  description: "Charger le fichier mensuel de l’OFII.",
  icon: "fr-icon-upload-2-line",
  href: "/parametres/cockpit-admin/import-ofii",
  isEnabled: true,
};

describe("CockpitFeatureTile", () => {
  it("mène à la fonctionnalité quand elle est activée", () => {
    render(<CockpitFeatureTile feature={feature} />);

    expect(screen.getByRole("link", { name: /Import OFII/ })).toHaveAttribute(
      "href",
      "/parametres/cockpit-admin/import-ofii"
    );
    expect(screen.queryByText("Bientôt disponible")).not.toBeInTheDocument();
  });

  it("annonce une fonctionnalité désactivée sans lien", () => {
    render(<CockpitFeatureTile feature={{ ...feature, isEnabled: false }} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Bientôt disponible")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Import OFII" }).parentElement
    ).toHaveAttribute("aria-disabled", "true");
  });
});
