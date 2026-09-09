import dayjs from "dayjs";

import { TimePeriod } from "@/app/components/common/TimePeriodSelector";
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

const filterPeriodsByRange = <T extends { date: string | Date }>(
  periods: T[],
  startMonth?: string,
  endMonth?: string,
  timePeriod?: TimePeriod
): T[] => {
  return periods.filter((periodStat) => {
    const date = dayjs(periodStat.date);
    const currentMonth = date.format("YYYY-MM");

    if (timePeriod === "byYear") {
      const currentYear = date.year();
      const startYear = startMonth
        ? Number(startMonth.split("-")[0])
        : undefined;
      const endYear = endMonth ? Number(endMonth.split("-")[0]) : undefined;

      if (startYear !== undefined && currentYear < startYear) {
        return false;
      }
      if (endYear !== undefined && currentYear > endYear) {
        return false;
      }
      return true;
    }

    if (startMonth && currentMonth < startMonth) {
      return false;
    }
    if (endMonth && currentMonth > endMonth) {
      return false;
    }
    return true;
  });
};

export const getLastDisplayedPeriods = <T extends { date: string | Date }>(
  periods: T[],
  fromYear: number = START_YEAR,
  startMonth?: string,
  endMonth?: string,
  timePeriod?: TimePeriod
): T[] => {
  const displayedPeriods = filterDisplayedPeriods(periods, fromYear);
  const filteredPeriods = filterPeriodsByRange(
    displayedPeriods,
    startMonth,
    endMonth,
    timePeriod
  );

  return filteredPeriods
    .sort(
      (firstPeriod, secondPeriod) =>
        new Date(firstPeriod.date).getTime() -
        new Date(secondPeriod.date).getTime()
    )
    .slice(-MAX_DISPLAYED_TIME_PERIODS);
};
