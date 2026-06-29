import { describe, expect, it } from "vitest";

import {
  getActiveStructureIdsForPeriod,
  getMonthPeriodBounds,
  getTrimesterPeriodBounds,
  isStructureActiveInPeriod,
  isStructureActiveInYear,
} from "@/app/api/statistiques/statistiques.utils";

import { buildTestYearContext } from "./test-helpers";

describe("statistiques period utils", () => {
  const closureMarch2024 = new Date("2024-03-01T00:00:00.000Z");
  const yearContext = buildTestYearContext([1], {
    openingDate: new Date("2020-01-01T00:00:00.000Z"),
    closureDates: new Map([[1, closureMarch2024]]),
    years: [2023, 2024, 2025],
  });

  it("should count structure active in year of closure but not after", () => {
    expect(isStructureActiveInYear(1, 2024, yearContext)).toBe(true);
    expect(isStructureActiveInYear(1, 2025, yearContext)).toBe(false);
  });

  it("should count structure active in month of closure but not after", () => {
    const february2024 = getMonthPeriodBounds("2024-02");
    const march2024 = getMonthPeriodBounds("2024-03");
    const april2024 = getMonthPeriodBounds("2024-04");

    expect(
      isStructureActiveInPeriod(1, february2024.start, february2024.end, yearContext)
    ).toBe(true);
    expect(
      isStructureActiveInPeriod(1, march2024.start, march2024.end, yearContext)
    ).toBe(true);
    expect(
      isStructureActiveInPeriod(1, april2024.start, april2024.end, yearContext)
    ).toBe(false);
  });

  it("should count structure active in trimester of closure but not after", () => {
    const q1_2024 = getTrimesterPeriodBounds(2024, 1);
    const q2_2024 = getTrimesterPeriodBounds(2024, 2);

    expect(
      getActiveStructureIdsForPeriod(yearContext, q1_2024.start, q1_2024.end)
    ).toEqual(new Set([1]));
    expect(
      getActiveStructureIdsForPeriod(yearContext, q2_2024.start, q2_2024.end)
    ).toEqual(new Set());
  });
});
