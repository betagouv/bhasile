import { describe, expect, it, vi } from "vitest";

import { resolveFilters } from "@/app/api/filters/filters.service";

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  findOperateurFiliales: async (parentIds: number[]) =>
    parentIds.includes(1) ? [{ id: 11 }, { id: 12 }] : [],
}));

describe("resolveFilters", () => {
  it("ajoute les filiales des opérateurs filtrés, sans remonter d'une filiale à son groupe", async () => {
    const filters = await resolveFilters({
      departements: "75",
      operateurs: "1,11,3",
      types: null,
    });

    expect(filters).toEqual({
      departementList: ["75"],
      operateurList: ["1", "11", "3", "12"],
      typeList: [],
    });
  });
});
