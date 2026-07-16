import { describe, expect, it } from "vitest";

import {
  checkCreatedStructureDepartement,
  checkNoDepartementAdministratifChange,
} from "@/app/api/structure-versions/structure-version.util";
import { ApiDomainError } from "@/app/utils/apiDomainError.util";

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
