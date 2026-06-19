import { describe, expect, it } from "vitest";

import { computeControleQualiteStatistiques } from "@/app/api/statistiques/controle-qualite/controle-qualite.util";

describe("controle qualite statistiques util", () => {
  it("aggregates trimester notes from all evaluations, not monthly averages", () => {
    const result = computeControleQualiteStatistiques(
      [1],
      100,
      [],
      [
        {
          structureId: 1,
          date: new Date("2025-01-15"),
          note: 2,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        },
        ...Array.from({ length: 10 }, () => ({
          structureId: 1,
          date: new Date("2025-02-15"),
          note: 4,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        })),
      ],
      [],
      "moyenne"
    );

    const trimester2025Q1 = result.byTrimester.find(
      (entry) => entry.year === 2025 && entry.trimester === 1
    );

    expect(trimester2025Q1?.noteGenerale).toBe(3.8);
    expect(result.byMonth).toHaveLength(2);
    expect(result.byYear).toHaveLength(1);
    expect(result.byYear[0]?.noteGenerale).toBe(3.8);
  });
});
