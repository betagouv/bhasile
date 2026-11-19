import { describe, expect, it } from "vitest";

import { findCockpitFeature } from "@/utils/cockpit-admin.util";

describe("findCockpitFeature", () => {
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
