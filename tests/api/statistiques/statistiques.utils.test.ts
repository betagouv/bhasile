import { beforeEach, describe, expect, it } from "vitest";

import {
  getActiveStructureIds,
  getPeriodBounds,
  indexActiveStructureIds,
} from "@/app/api/statistiques/statistiques.utils";

import { buildTestActivityContext } from "./test-helpers";

describe("statistiques period utils", () => {
  const closureMarch2024 = new Date("2024-03-01T00:00:00.000Z");
  const activityContext = buildTestActivityContext([1], {
    openingDate: new Date("2020-01-01T00:00:00.000Z"),
    closureDates: new Map([[1, closureMarch2024]]),
  });

  beforeEach(() => {
    indexActiveStructureIds(activityContext, "year", ["2024", "2025"]);
    indexActiveStructureIds(activityContext, "month", [
      "2024-02",
      "2024-03",
      "2024-04",
    ]);
    indexActiveStructureIds(activityContext, "trimester", ["2024-Q1", "2024-Q2"]);
  });

  it("should count structure active in year of closure but not after", () => {
    expect(getActiveStructureIds(activityContext, "year", "2024")).toEqual(
      new Set([1])
    );
    expect(getActiveStructureIds(activityContext, "year", "2025")).toEqual(
      new Set()
    );
  });

  it("should count structure active in month of closure but not after", () => {
    expect(getActiveStructureIds(activityContext, "month", "2024-02")).toEqual(
      new Set([1])
    );
    expect(getActiveStructureIds(activityContext, "month", "2024-03")).toEqual(
      new Set([1])
    );
    expect(getActiveStructureIds(activityContext, "month", "2024-04")).toEqual(
      new Set()
    );
  });

  it("should count structure active in trimester of closure but not after", () => {
    expect(
      getActiveStructureIds(activityContext, "trimester", "2024-Q1")
    ).toEqual(new Set([1]));
    expect(
      getActiveStructureIds(activityContext, "trimester", "2024-Q2")
    ).toEqual(new Set());
  });

  it("should resolve consistent bounds for each granularity", () => {
    expect(getPeriodBounds("month", "2024-03")).toEqual({
      start: new Date(Date.UTC(2024, 2, 1)),
      end: new Date(Date.UTC(2024, 3, 1)),
    });
    expect(getPeriodBounds("trimester", "2024-Q1")).toEqual({
      start: new Date(Date.UTC(2024, 0, 1)),
      end: new Date(Date.UTC(2024, 3, 1)),
    });
    expect(getPeriodBounds("year", "2024")).toEqual({
      start: new Date(Date.UTC(2024, 0, 1)),
      end: new Date(Date.UTC(2025, 0, 1)),
    });
  });
});
