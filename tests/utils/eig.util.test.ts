import { describe, expect, it } from "vitest";

import { isEigComportementViolent } from "@/app/utils/eig.util";

describe("eig util", () => {
  describe("isEigComportementViolent", () => {
    it("should match comportement violent variants", () => {
      expect(isEigComportementViolent("Comportement violent")).toBe(true);
      expect(isEigComportementViolent("comportement  violent")).toBe(true);
      expect(isEigComportementViolent("Agression - comportement violent")).toBe(
        true
      );
      expect(
        isEigComportementViolent(
          "10. Comportement violent de la part des usagers envers d'autres usagers ou envers du personnel, au sein de la structure, ainsi que manquement grave au règlement de fonctionnement"
        )
      ).toBe(true);
      expect(
        isEigComportementViolent(
          "10. COMPORTEMENT VIOLENT de la part des usagers"
        )
      ).toBe(true);
    });

    it("should not match other motifs", () => {
      expect(isEigComportementViolent("Décès")).toBe(false);
      expect(isEigComportementViolent("comportement")).toBe(false);
    });
  });
});
