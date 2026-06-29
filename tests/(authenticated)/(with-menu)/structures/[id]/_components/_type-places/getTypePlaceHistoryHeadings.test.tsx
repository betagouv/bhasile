import { isValidElement, ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { getTypePlaceHistoryHeadings } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_type-places/getTypePlaceHistoryHeadings";

const getDataYear = (heading: ReactElement): number | undefined =>
  (heading.props as { "data-year"?: number })["data-year"];

describe("getTypePlaceHistoryHeadings", () => {
  it("stamps data-year on every year column so the markers overlay can locate them", () => {
    const years = [2023, 2024, 2025];

    const headings = getTypePlaceHistoryHeadings(years);
    const yearHeadings = headings.filter(
      (heading) => isValidElement(heading) && getDataYear(heading) !== undefined
    );

    expect(yearHeadings.map(getDataYear)).toEqual(years);
  });

  it("prepends a single non-year label column", () => {
    expect(getTypePlaceHistoryHeadings([2023])).toHaveLength(2);
  });
});
