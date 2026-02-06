import "dayjs/locale/fr.js";

import dayjs from "dayjs";

import { CURRENT_YEAR } from "@/constants";

dayjs.locale("fr");

export const formatDate = (
  date: Date | string | number | undefined
): string => {
  if (!date) {
    return "N/D";
  }
  if (typeof date === "string") {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }
  }
  const dateObject = date instanceof Date ? date : new Date(date);
  return dateObject.toLocaleDateString("fr-FR");
};

export const formatDateToIsoString = (
  date: string | undefined | null,
  defaultToToday: boolean = false
): string | null => {
  if (date) {
    if (/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|([\+\-]\d{2}:\d{2}))?)?$/.test(date)) {
      return date;
    }
    return dayjs(date, "DD/MM/YYYY").toISOString();
  }
  if (defaultToToday) {
    return dayjs().toISOString();
  }
  return null;
};

export const getMonthsBetween = (
  startDate?: string | null,
  endDate?: string | null
): dayjs.Dayjs[] => {
  const start = dayjs(startDate).startOf("month");
  const end = dayjs(endDate).startOf("month");

  if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
    return [];
  }

  const diffInMonths = end.diff(start, "month") + 1;

  return Array.from({ length: diffInMonths }, (_, index) => {
    return start.add(index, "month");
  });
};

export const getLastMonths = (numberOfMonths: number): dayjs.Dayjs[] => {
  return Array.from({ length: numberOfMonths }, (_, index) => {
    return dayjs().subtract(index, "month");
  }).reverse();
};

export const formatForCharts = (date: dayjs.Dayjs): string => {
  return date.format("MMM YYYY").toUpperCase();
};

export const getYearDate = (year: string | number): string => {
  return new Date(Number(year), 0, 1, 13).toLocaleDateString("fr-FR");
};

export const getDateFromYear = (year: string | number): Date => {
  return new Date(Number(year), 0, 1, 13);
};
export const getYearFromDate = (
  date: string | number | Date | undefined | null
): number => {
  if (!date) {
    return -1;
  }
  if (typeof date === "string") {
    const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      return Number(match[3]);
    }
    const isIsoString = date.includes("T") || date.endsWith("Z");
    if (isIsoString) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.getUTCFullYear();
      }
    } else {
      const parsed = dayjs(date);
      if (parsed.isValid()) {
        return parsed.year();
      }
    }
    return -1;
  }
  if (date instanceof Date) {
    return date.getFullYear();
  }
  if (typeof date === "number") {
    return date;
  }
  return -1;
};
export const parseFrDate = (value: unknown): Date | unknown => {
  if (typeof value === "string") {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, dd, mm, yyyy] = match;
      const isoString = `${yyyy}-${mm}-${dd}`;
      const date = new Date(isoString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  return value;
};

export const getDocumentsFinanciersYearRange = ({
  isAutorisee,
}: {
  isAutorisee: boolean;
}): { years: number[]; startIndex: number } => {
  const startIndex = isAutorisee ? 0 : 2;
  const { years } = getYearRange();
  return { years: years.slice(startIndex), startIndex };
};

export const getTypePlacesYearRange = (): { years: number[] } => {
  const { years } = getYearRange({
    startYear: 2023,
    endYear: CURRENT_YEAR,
  });
  return { years };
};

export const getYearRange = ({
  startYear = 2021,
  endYear = CURRENT_YEAR,
  order = "asc",
}: {
  startYear?: number;
  endYear?: number;
  order?: "asc" | "desc";
} = {}): { years: number[] } => {
  const yearsRange = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => endYear - i
  );

  const years = order === "asc" ? yearsRange : yearsRange.reverse();

  return { years };
};

export const getElapsedPercentage = ({
  dateStart,
  dateEnd,
}: {
  dateStart: string;
  dateEnd: string;
}): number => {
  const now = dayjs();
  const start = dayjs(dateStart);
  const end = dayjs(dateEnd);

  if (now.isBefore(start)) {
    return 0;
  }
  if (now.isAfter(end)) {
    return 100;
  }

  const total = end.diff(start, "millisecond");
  const elapsed = now.diff(start, "millisecond");

  if (total === 0) {
    return 100;
  }

  return Math.min(100, Math.max(0, (elapsed / total) * 100));
};
