import { describe, expect, it, vi } from "vitest";

import { resolveGlobalFilters } from "@/app/api/operateurs/operateur-filters.service";

vi.mock("@/app/api/operateurs/operateur.repository", () => ({
  findOperateurFiliales: async (parentIds: number[]) =>
    parentIds.includes(1) ? [{ id: 11 }, { id: 12 }] : [],
}));

describe("resolveGlobalFilters", () => {
  it("ajoute les filiales des opérateurs filtrés", async () => {
    const filters = await resolveGlobalFilters({
      departements: "75",
      operateurs: "1,3",
      types: null,
    });

    expect(filters).toEqual({
      departementList: ["75"],
      operateurList: ["1", "3", "11", "12"],
      typeList: [],
    });
  });

  it("garde une filiale sélectionnée seule sans remonter à son groupe", async () => {
    const { operateurList } = await resolveGlobalFilters({ operateurs: "11" });

    expect(operateurList).toEqual(["11"]);
  });
});
