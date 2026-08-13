import { CURRENT_YEAR, START_YEAR } from "@/constants";

import { getYearFromDate } from "./date.util";

const MAX_DISPLAYED_TIME_PERIODS = 10;

const isDisplayedYear = (year: number, fromYear: number): boolean =>
  year >= fromYear && year <= CURRENT_YEAR;

export const filterDisplayedPeriods = <T extends { date: string | Date }>(
  periods: T[],
  fromYear: number = START_YEAR
): T[] =>
  periods.filter((period) =>
    isDisplayedYear(getYearFromDate(period.date), fromYear)
  );

export const filterDisplayedYears = <T extends { year: number }>(
  items: T[],
  fromYear: number = START_YEAR
): T[] => items.filter((item) => isDisplayedYear(item.year, fromYear));

export const getLastDisplayedPeriods = <T extends { date: string | Date }>(
  periods: T[],
  fromYear: number = START_YEAR
): T[] =>
  filterDisplayedPeriods(periods, fromYear)
    .sort(
      (firstPeriod, secondPeriod) =>
        new Date(firstPeriod.date).getTime() -
        new Date(secondPeriod.date).getTime()
    )
    .slice(-MAX_DISPLAYED_TIME_PERIODS);
