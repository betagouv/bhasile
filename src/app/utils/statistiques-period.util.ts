import { CURRENT_YEAR, START_YEAR } from "@/constants";

import { getYearFromDate } from "./date.util";

const MAX_DISPLAYED_TIME_PERIODS = 10;

const isDisplayedYear = (year: number): boolean =>
  year >= START_YEAR && year <= CURRENT_YEAR;

export const filterDisplayedPeriods = <T extends { date: string | Date }>(
  periods: T[]
): T[] =>
  periods.filter((period) => isDisplayedYear(getYearFromDate(period.date)));

export const filterDisplayedYears = <T extends { year: number }>(
  items: T[]
): T[] => items.filter((item) => isDisplayedYear(item.year));

export const getLastDisplayedPeriods = <T extends { date: string | Date }>(
  periods: T[]
): T[] =>
  filterDisplayedPeriods(periods)
    .sort(
      (firstPeriod, secondPeriod) =>
        new Date(firstPeriod.date).getTime() -
        new Date(secondPeriod.date).getTime()
    )
    .slice(-MAX_DISPLAYED_TIME_PERIODS);
