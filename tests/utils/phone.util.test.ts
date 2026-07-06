import { formatPhoneNumber } from "@/app/utils/phone.util";

describe("phone util", () => {
  describe("formatPhoneNumber", () => {
    it("formate un numéro de mobile français commençant par 0", () => {
      expect(formatPhoneNumber("0612345678")).toBe(`06 12 34 56 78`);
    });

    it("formate un numéro fixe français commençant par 0", () => {
      expect(formatPhoneNumber("0123456789")).toBe(`01 23 45 67 89`);
    });

    it("formate un numéro international commençant par +", () => {
      expect(formatPhoneNumber("+33612345678")).toBe(`06 12 34 56 78`);
    });

    it("formate un numéro sans 0 initial", () => {
      expect(formatPhoneNumber("612345678")).toBe(`06 12 34 56 78`);
    });

    it("formate un numéro français avec des points", () => {
      expect(formatPhoneNumber("06.12.34.56.78")).toBe(`06 12 34 56 78`);
    });

    it("formate un numéro français avec des espaces", () => {
      expect(formatPhoneNumber("06 12 34 56 78")).toBe(`06 12 34 56 78`);
    });

    it("formate un numéro français avec des séparateurs mélangés", () => {
      expect(formatPhoneNumber("06-12.34 56 78")).toBe(`06 12 34 56 78`);
    });

    it("formate un numéro préfixé par l'indicatif pays 33", () => {
      expect(formatPhoneNumber("33612345678")).toBe(`06 12 34 56 78`);
    });

    it("gère un numéro avec des parenthèses", () => {
      expect(formatPhoneNumber("(06) 12 34 56 78")).toBe(`06 12 34 56 78`);
    });

    it("gère un numéro avec des espaces en début et en fin", () => {
      expect(formatPhoneNumber("  0612345678  ")).toBe(`06 12 34 56 78`);
    });

    it("gère un numéro très court", () => {
      expect(formatPhoneNumber("123")).toBe(`12 3`);
    });

    it("gère un numéro très long", () => {
      expect(formatPhoneNumber("+331234567890123")).toBe(
        `01 23 45 67 89 01 23`
      );
    });

    it("gère une chaîne vide", () => {
      expect(formatPhoneNumber("")).toBe("");
    });

    it("gère une entrée invalide", () => {
      expect(formatPhoneNumber("abc")).toBe("");
    });
  });
});
