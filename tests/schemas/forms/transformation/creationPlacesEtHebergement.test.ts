import { describe, expect, it } from "vitest";

import { getPlacesDirection } from "@/schemas/forms/transformation/creationPlacesEtHebergement.schema";
import { FormKind } from "@/types/global";

describe("getPlacesDirection", () => {
  it("valide une extension qui augmente le nombre de places", () => {
    expect(getPlacesDirection(FormKind.EXTENSION, 50, 60)).toBe("valid");
  });

  it("signale une contradiction quand une extension diminue le nombre de places", () => {
    expect(getPlacesDirection(FormKind.EXTENSION, 50, 40)).toBe("contradiction");
  });

  it("valide une contraction qui diminue le nombre de places", () => {
    expect(getPlacesDirection(FormKind.CONTRACTION, 50, 40)).toBe("valid");
  });

  it("signale une contradiction quand une contraction augmente le nombre de places", () => {
    expect(getPlacesDirection(FormKind.CONTRACTION, 50, 60)).toBe(
      "contradiction"
    );
  });

  it("renvoie unchanged quand le nombre de places est égal au précédent", () => {
    expect(getPlacesDirection(FormKind.EXTENSION, 50, 50)).toBe("unchanged");
    expect(getPlacesDirection(FormKind.CONTRACTION, 50, 50)).toBe("unchanged");
  });

  it("ne juge pas un champ vide (valeur undefined)", () => {
    expect(getPlacesDirection(FormKind.EXTENSION, 50, undefined)).toBe("valid");
  });

  it("ne juge pas une valeur non finie (NaN)", () => {
    expect(getPlacesDirection(FormKind.CONTRACTION, 50, NaN)).toBe("valid");
  });

  it("ne juge pas un formKind qui n'est ni extension ni contraction", () => {
    expect(getPlacesDirection(FormKind.FINALISATION, 50, 60)).toBe("valid");
    expect(getPlacesDirection(FormKind.OUVERTURE_EX_NIHILO, 50, 40)).toBe(
      "valid"
    );
  });
});
