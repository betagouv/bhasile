import { describe, expect, it } from "vitest";

import {
  COCKPIT_SECTIONS,
  findCockpitFeature,
} from "@/app/(authenticated)/(with-menu)/parametres/cockpit-admin/cockpit-admin.features";

describe("cockpit-admin.features", () => {
  it("attribue une adresse distincte à chaque fonctionnalité", () => {
    const hrefs = COCKPIT_SECTIONS.flatMap((section) =>
      section.features.map((feature) => feature.href)
    );

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("retrouve la fonctionnalité d'une page et de ses sous-pages", () => {
    expect(findCockpitFeature("/parametres/cockpit-admin/faq")?.title).toBe(
      "Questions de la FAQ"
    );
    expect(findCockpitFeature("/parametres/cockpit-admin/faq/12")?.title).toBe(
      "Questions de la FAQ"
    );
  });

  it("ne confond pas une adresse qui ne fait que commencer comme une autre", () => {
    expect(findCockpitFeature("/parametres/cockpit-admin/faq-archive")).toBe(
      null
    );
  });
});
