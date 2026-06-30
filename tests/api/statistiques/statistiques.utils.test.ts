import { beforeEach, describe, expect, it } from "vitest";

import {
  buildActivityIndex,
  getEffectiveStructureVersionAtDate,
  getPeriodBounds,
  lookupActiveStructureIds,
  lookupStructureIdsForDnaAtDate,
} from "@/app/api/statistiques/statistiques.utils";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActivityContext,
  buildTestDnaLinks,
  buildTestStructureVersionTimeline,
} from "./test-helpers";

describe("statistiques period utils", () => {
  const closureMarch2024 = new Date("2024-03-01T00:00:00.000Z");
  const activityContext = buildTestActivityContext([1], {
    openingDate: new Date("2020-01-01T00:00:00.000Z"),
    closureDates: new Map([[1, closureMarch2024]]),
  });
  const activeStructureIdsByPeriod = {
    month: new Map<string, Set<number>>(),
    trimester: new Map<string, Set<number>>(),
    year: new Map<string, Set<number>>(),
  };

  beforeEach(() => {
    activeStructureIdsByPeriod.month.clear();
    activeStructureIdsByPeriod.trimester.clear();
    activeStructureIdsByPeriod.year.clear();

    buildActivityIndex(activityContext, activeStructureIdsByPeriod, {
      typologieYears: [2024, 2025],
      referenceYear: 2026,
      periodDates: [
        new Date("2024-02-15"),
        new Date("2024-03-15"),
        new Date("2024-04-15"),
      ],
    });
  });

  it("should count structure active in year of closure but not after", () => {
    expect(
      lookupActiveStructureIds(activeStructureIdsByPeriod, "year", "2024")
    ).toEqual(new Set([1]));
    expect(
      lookupActiveStructureIds(activeStructureIdsByPeriod, "year", "2025")
    ).toEqual(new Set());
  });

  it("should count structure active in month of closure but not after", () => {
    expect(
      lookupActiveStructureIds(activeStructureIdsByPeriod, "month", "2024-02")
    ).toEqual(new Set([1]));
    expect(
      lookupActiveStructureIds(activeStructureIdsByPeriod, "month", "2024-03")
    ).toEqual(new Set([1]));
    expect(
      lookupActiveStructureIds(activeStructureIdsByPeriod, "month", "2024-04")
    ).toEqual(new Set());
  });

  it("should count structure active in trimester of closure but not after", () => {
    expect(
      lookupActiveStructureIds(
        activeStructureIdsByPeriod,
        "trimester",
        "2024-Q1"
      )
    ).toEqual(new Set([1]));
    expect(
      lookupActiveStructureIds(
        activeStructureIdsByPeriod,
        "trimester",
        "2024-Q2"
      )
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

describe("DNA resolution at date", () => {
  const timeline = buildTestStructureVersionTimeline([
    {
      structureId: 1,
      structureVersionId: 10,
      effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
    },
    {
      structureId: 1,
      structureVersionId: 11,
      effectiveDate: new Date("2025-01-01T00:00:00.000Z"),
    },
    {
      structureId: 2,
      structureVersionId: 20,
      effectiveDate: new Date("2025-01-01T00:00:00.000Z"),
      type: StructureType.CAES,
    },
  ]);

  const dnaLinks = buildTestDnaLinks([
    { structureId: 1, structureVersionId: 10, dnaCode: "DNA-SHARED" },
    { structureId: 2, structureVersionId: 20, dnaCode: "DNA-SHARED" },
    { structureId: 1, structureVersionId: 10, dnaCode: "DNA-OLD" },
  ]);

  it("should pick the effective structure version at date", () => {
    expect(
      getEffectiveStructureVersionAtDate(
        1,
        new Date("2024-06-01"),
        timeline
      )?.id
    ).toBe(10);
    expect(
      getEffectiveStructureVersionAtDate(
        2,
        new Date("2024-06-01"),
        timeline
      )
    ).toBeNull();
    expect(
      getEffectiveStructureVersionAtDate(
        2,
        new Date("2025-06-01"),
        timeline
      )?.id
    ).toBe(20);
  });

  it("should resolve DNA to the structure owning it on the effective version", () => {
    expect(
      lookupStructureIdsForDnaAtDate(
        "DNA-SHARED",
        new Date("2024-06-01"),
        dnaLinks,
        timeline
      )
    ).toEqual([1]);
    expect(
      lookupStructureIdsForDnaAtDate(
        "DNA-SHARED",
        new Date("2025-06-01"),
        dnaLinks,
        timeline
      )
    ).toEqual([2]);
    expect(
      lookupStructureIdsForDnaAtDate(
        "DNA-OLD",
        new Date("2025-06-01"),
        dnaLinks,
        timeline
      )
    ).toEqual([]);
  });
});
