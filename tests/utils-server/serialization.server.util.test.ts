import { describe, expect, it } from "vitest";

import { recursivelySerializeForClient } from "@/app/utils/serialization.util";

describe("recursivelySerializeForClient", () => {
  it("convertit correctement une Date au premier instant de l'année", () => {
    // GIVEN
    const date = new Date("2024-01-01T00:00:00.000Z");

    // WHEN
    const result = recursivelySerializeForClient(date);

    // THEN
    expect(result).toBe("2024-01-01T00:00:00.000Z");
  });

  it("convertit correctement une Date au dernier instant de l'année", () => {
    // GIVEN
    const date = new Date("2024-12-31T23:59:59.999Z");

    // WHEN
    const result = recursivelySerializeForClient(date);

    // THEN
    expect(result).toBe("2024-12-31T23:59:59.999Z");
  });

  it("sérialise un Decimal Prisma en chaîne plutôt que de descendre dans ses entrailles", () => {
    // GIVEN — une doublure structurelle du Decimal de Prisma : sa représentation
    // interne (signe, exposant, chiffres) plus toNumber et toJSON.
    const decimalDouble = {
      s: 1,
      e: 1,
      d: [48, 8566],
      toNumber: () => 48.8566,
      toJSON: () => "48.8566",
    };

    // WHEN
    const result = recursivelySerializeForClient({ latitude: decimalDouble });

    // THEN
    expect(result).toEqual({ latitude: "48.8566" });
  });

  it("laisse intact un objet qui expose un toNumber sans être un Decimal", () => {
    // GIVEN — un objet valeur quelconque : le prédicat ne doit pas l'écraser en chaîne
    const montant = { cents: 1250, toNumber: () => 12.5 };

    // WHEN
    const result = recursivelySerializeForClient({ montant });

    // THEN
    expect(result).toEqual({
      montant: expect.objectContaining({ cents: 1250 }),
    });
  });

  it("convertit correctement les Dates au sein d'objets et de tableaux profondément imbriqués", () => {
    // GIVEN
    const input = {
      name: "test",
      createdAt: new Date("2025-03-10T08:15:30.000Z"),
      nested: {
        updatedAt: new Date("2025-04-20T18:45:00.500Z"),
        history: [
          new Date("2024-06-15T12:30:45.123Z"),
          {
            milestones: [
              { at: new Date("2024-08-01T00:00:00.000Z") },
              ["keep", new Date("2024-09-30T23:59:59.999Z"), 42],
            ],
          },
        ],
      },
    };

    // WHEN
    const result = recursivelySerializeForClient(input);

    // THEN
    expect(result).toEqual({
      name: "test",
      createdAt: "2025-03-10T08:15:30.000Z",
      nested: {
        updatedAt: "2025-04-20T18:45:00.500Z",
        history: [
          "2024-06-15T12:30:45.123Z",
          {
            milestones: [
              { at: "2024-08-01T00:00:00.000Z" },
              ["keep", "2024-09-30T23:59:59.999Z", 42],
            ],
          },
        ],
      },
    });
  });

  it("retourne la valeur inchangée quand ce n'est pas une Date", () => {
    // GIVEN
    const input = "not a date";

    // WHEN
    const result = recursivelySerializeForClient(input);

    // THEN
    expect(result).toBe("not a date");
  });
});
