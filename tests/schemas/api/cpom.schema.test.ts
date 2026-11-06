import { describe, expect, it } from "vitest";

import { cpomApiSchema } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

describe("cpomApiSchema", () => {
  it("accepte en écriture une structure liée sans les champs calculés en lecture", () => {
    const result = cpomApiSchema.safeParse({
      id: 1,
      structures: [
        {
          structureId: 42,
          structure: {
            codeBhasile: "BHA-42",
            type: StructureType.CADA,
            communeAdministrative: "Nancy",
            operateur: { id: 3, name: "Opérateur" },
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
