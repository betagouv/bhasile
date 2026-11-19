import { describe, expect, it } from "vitest";

import { COCKPIT_SECTIONS } from "@/config/cockpit-admin.config";

describe("cockpit-admin.config", () => {
  it("attribue une adresse distincte à chaque fonctionnalité", () => {
    const hrefs = COCKPIT_SECTIONS.flatMap((section) =>
      section.features.map((feature) => feature.href)
    );

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
