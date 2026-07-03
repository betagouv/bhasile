import { describe, expect, it } from "vitest";

import {
  isVersionValid,
  resolveCurrentVersion,
} from "@/app/api/structure-versions/structure-version.util";

const baseVersion = {
  id: 1,
  effectiveDate: new Date("2026-01-01"),
  structureVersionTransformationId: null,
  structureVersionTransformation: null,
  campaignId: null,
  campaign: null,
};

describe("isVersionValid", () => {
  it("valide une version sans transformation ni campagne", () => {
    expect(isVersionValid(baseVersion)).toBe(true);
  });

  it("valide une transformation dont le form est finalisé", () => {
    expect(
      isVersionValid({
        ...baseVersion,
        structureVersionTransformationId: 7,
        structureVersionTransformation: {
          transformation: { form: { status: true } },
        },
      })
    ).toBe(true);
  });

  it("invalide une transformation dont le form n'est pas finalisé", () => {
    expect(
      isVersionValid({
        ...baseVersion,
        structureVersionTransformationId: 7,
        structureVersionTransformation: {
          transformation: { form: { status: false } },
        },
      })
    ).toBe(false);
  });

  it("valide une campagne d'initialisation (sans form)", () => {
    expect(
      isVersionValid({
        ...baseVersion,
        campaignId: 3,
        campaign: { form: null },
      })
    ).toBe(true);
  });

  it("invalide une actualisation en brouillon (form status false)", () => {
    expect(
      isVersionValid({
        ...baseVersion,
        campaignId: 3,
        campaign: { form: { status: false } },
      })
    ).toBe(false);
  });

  it("valide une actualisation validée (form status true)", () => {
    expect(
      isVersionValid({
        ...baseVersion,
        campaignId: 3,
        campaign: { form: { status: true } },
      })
    ).toBe(true);
  });
});

describe("resolveCurrentVersion — invariant coquille d'actualisation", () => {
  it("exclut une coquille à effectiveDate null même quand isVersionValid la jugerait valide", () => {
    const stub = {
      ...baseVersion,
      id: 20,
      effectiveDate: null,
      campaignId: 5,
      campaign: { form: null },
    };
    const predecessor = {
      ...baseVersion,
      id: 10,
      effectiveDate: new Date("2025-01-01"),
    };

    expect(isVersionValid(stub)).toBe(true);
    expect(
      resolveCurrentVersion([stub, predecessor], new Date("2026-06-01"))?.id
    ).toBe(10);
  });
});
