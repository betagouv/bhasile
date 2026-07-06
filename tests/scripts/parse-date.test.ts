import { parseDate } from "../../scripts/utils/parse-date";

describe("parseDate util", () => {
  it("nettoie la valeur et lève une erreur quand la chaîne est vide", () => {
    // GIVEN
    const value = "   ";
    const context = "date_debut";

    // WHEN / THEN
    expect(() => parseDate(value, context)).toThrowError(
      "date_debut: valeur vide"
    );
  });

  it("interprète une année à 4 chiffres comme le 1er janvier à 12:00:00 de cette année", () => {
    // GIVEN
    const value = "2021";
    const context = "year";

    // WHEN
    const result = parseDate(value, context);

    // THEN
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2021);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it("interprète une chaîne de date valide au format ISO", () => {
    // GIVEN
    const value = "2024-03-15T10:30:00.000Z";
    const context = "iso";

    // WHEN
    const result = parseDate(value, context);

    // THEN
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe("2024-03-15T10:30:00.000Z");
  });

  it("lève une erreur pour une chaîne de date non vide invalide", () => {
    // GIVEN
    const value = "not-a-date";
    const context = "date_fin";

    // WHEN / THEN
    expect(() => parseDate(value, context)).toThrowError(
      "date_fin: format de date invalide (not-a-date)"
    );
  });
});
