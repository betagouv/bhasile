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
    });

    it("should not match other motifs", () => {
      expect(isEigComportementViolent("Décès")).toBe(false);
      expect(isEigComportementViolent("comportement")).toBe(false);
    });
  });
});
