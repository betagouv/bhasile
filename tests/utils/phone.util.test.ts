import { formatPhoneNumber } from "@/app/utils/phone.util";

describe("phone util", () => {
  describe("formatPhoneNumber", () => {
    it("should format French mobile number with 0", () => {
      expect(formatPhoneNumber("0612345678")).toBe(`06 12 34 56 78`);
    });

    it("should format French landline number with 0", () => {
      expect(formatPhoneNumber("0123456789")).toBe(`01 23 45 67 89`);
    });

    it("should format international number with +", () => {
      expect(formatPhoneNumber("+33612345678")).toBe(`06 12 34 56 78`);
    });

    it("should format number without 0", () => {
      expect(formatPhoneNumber("612345678")).toBe(`06 12 34 56 78`);
    });

    it("should format French number with dots", () => {
      expect(formatPhoneNumber("06.12.34.56.78")).toBe(`06 12 34 56 78`);
    });

    it("should format French number with spaces", () => {
      expect(formatPhoneNumber("06 12 34 56 78")).toBe(`06 12 34 56 78`);
    });

    it("should format French number with mixed separators", () => {
      expect(formatPhoneNumber("06-12.34 56 78")).toBe(`06 12 34 56 78`);
    });

    it("should format number with country code 33 prefix", () => {
      expect(formatPhoneNumber("33612345678")).toBe(`06 12 34 56 78`);
    });

    it("should handle number with parentheses", () => {
      expect(formatPhoneNumber("(06) 12 34 56 78")).toBe(`06 12 34 56 78`);
    });

    it("should handle number with leading/trailing spaces", () => {
      expect(formatPhoneNumber("  0612345678  ")).toBe(`06 12 34 56 78`);
    });

    it("should handle very short number", () => {
      expect(formatPhoneNumber("123")).toBe(`12 3`);
    });

    it("should handle very long number", () => {
      expect(formatPhoneNumber("+331234567890123")).toBe(
        `01 23 45 67 89 01 23`
      );
    });

    it("should handle empty string", () => {
      expect(formatPhoneNumber("")).toBe("");
    });

    it("should handle invalid input", () => {
      expect(formatPhoneNumber("abc")).toBe("");
    });
  });
});
