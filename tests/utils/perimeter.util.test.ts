import { createPerimeterRead } from "tests/test-utils/factories/agent.factory";
import { describe, expect, it } from "vitest";

import { toPerimeterApiCreate } from "@/schemas/forms/base/perimeter.schema";
import {
  findPerimetersInZone,
  getDefaultPerimeterName,
} from "@/utils/perimeter.util";

const finistere = {
  scope: "DEPARTEMENT" as const,
  id: "29",
  name: "Finistère",
};

describe("perimeter.util", () => {
  it("nomme un périmètre d'après sa zone", () => {
    expect(getDefaultPerimeterName(finistere)).toBe("DDETS Finistère");
    expect(
      getDefaultPerimeterName({ scope: "REGION", id: "5", name: "Bretagne" })
    ).toBe("DREETS Bretagne");
  });

  it("retrouve les périmètres qui couvrent déjà une zone", () => {
    const sameZone = createPerimeterRead();
    const otherZone = createPerimeterRead({ id: 4, zoneKey: "DEPARTEMENT:56" });

    expect(findPerimetersInZone([sameZone, otherZone], finistere)).toEqual([
      sameZone,
    ]);
  });

  it("convertit une région saisie dans le formulaire en identifiant numérique", () => {
    expect(
      toPerimeterApiCreate({ scope: "REGION", zoneId: "5", name: "DREETS" })
    ).toEqual({ scope: "REGION", regionId: 5, name: "DREETS" });
  });
});
