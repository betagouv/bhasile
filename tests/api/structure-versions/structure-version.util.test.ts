import { describe, expect, it } from "vitest";

import { checkNoDepartementAdministratifChange } from "@/app/api/structure-versions/structure-version.util";
import { ApiDomainError } from "@/app/utils/apiErrorResponse.util";

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
