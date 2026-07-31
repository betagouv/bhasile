import { describe, expect, it } from "vitest";

import {
  checkCreatedStructureDepartement,
  checkNoDepartementAdministratifChange,
  isVersionValid,
  resolveCurrentVersion,
} from "@/app/api/structure-versions/structure-version.util";
import { ApiDomainError } from "@/app/utils/apiDomainError.util";

const baseVersion = {
  id: 1,
  effectiveDate: new Date("2026-01-01"),
  structureVersionTransformationId: null,
  structureVersionTransformation: null,
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

});

describe("resolveCurrentVersion", () => {
  const socle = { ...baseVersion, id: 20, effectiveDate: null };

  it("retient le socle (effectiveDate null) en l'absence de version datée effective", () => {
    expect(
      resolveCurrentVersion([socle], new Date("2026-06-01"))?.id
    ).toBe(20);
  });

  it("supplante le socle par une version datée déjà effective", () => {
    const datee = { ...baseVersion, id: 10, effectiveDate: new Date("2025-01-01") };
    expect(
      resolveCurrentVersion([socle, datee], new Date("2026-06-01"))?.id
    ).toBe(10);
  });

  it("retombe sur le socle quand les versions datées sont dans le futur", () => {
    const future = { ...baseVersion, id: 10, effectiveDate: new Date("2028-01-01") };
    expect(
      resolveCurrentVersion([socle, future], new Date("2026-06-01"))?.id
    ).toBe(20);
  });
});

describe("checkNoDepartementAdministratifChange", () => {
  it("laisse passer quand le département de la version est identique à l'invariant", () => {
    expect(() =>
      checkNoDepartementAdministratifChange("75", "75")
    ).not.toThrow();
  });

  it("laisse passer quand l'invariant n'est pas encore posé (structure null)", () => {
    expect(() =>
      checkNoDepartementAdministratifChange(null, "69")
    ).not.toThrow();
  });

  it("laisse passer quand la version ne touche pas au département (undefined)", () => {
    expect(() =>
      checkNoDepartementAdministratifChange("75", undefined)
    ).not.toThrow();
  });

  it("rejette quand la version change de département", () => {
    expect(() => checkNoDepartementAdministratifChange("75", "69")).toThrow(
      ApiDomainError
    );
  });
});

describe("checkCreatedStructureDepartement", () => {
  it("rejette une structure créée hors du département des structures d'origine", () => {
    expect(() => checkCreatedStructureDepartement("75", "92")).toThrow(
      ApiDomainError
    );
  });

  it("laisse créer une structure ex-nihilo quand il n'y a pas d'ancre", () => {
    expect(() =>
      checkCreatedStructureDepartement(null, "92")
    ).not.toThrow();
  });

  it("laisse passer une structure créée dans le même département que les sources", () => {
    expect(() =>
      checkCreatedStructureDepartement("75", "75")
    ).not.toThrow();
  });
});
