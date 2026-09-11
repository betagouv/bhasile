export const toYearMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const computeStartMonth = (endMonth: string): string => {
  if (!endMonth) {
    return "";
  }
  const [year, month] = endMonth.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 5);
  return toYearMonth(date);
};

export type PdfExportDateRange = {
  typePlacesFinancesStartYear: number;
  typePlacesFinancesEndYear: number;
  activiteStartMonth: string;
  activiteEndMonth: string;
};

type GetPdfExportPayloadOptions = {
  typePlacesYears?: number[];
  financeYears?: number[];
  activiteDates?: (string | Date)[];
};

export const getPdfExportPayload = (
  options?: GetPdfExportPayloadOptions
): PdfExportDateRange => {
  const {
    typePlacesYears = [],
    financeYears = [],
    activiteDates = [],
  } = options || {};

  const typePlacesLastYear = typePlacesYears.length
    ? Math.max(...typePlacesYears)
    : 0;
  const financeLastYear = financeYears.length ? Math.max(...financeYears) : 0;
  const latestDataYear = Math.max(typePlacesLastYear, financeLastYear);
  const endYear = latestDataYear || new Date().getFullYear();
  const startYear = endYear - 4;

  const latestActivityTimestamp = activiteDates.length
    ? Math.max(...activiteDates.map((date) => new Date(date).getTime()))
    : new Date().getTime();

  const latestActivityDate = new Date(latestActivityTimestamp);
  const endMonth = toYearMonth(latestActivityDate);
  const startMonth = computeStartMonth(endMonth);

  return {
    typePlacesFinancesStartYear: startYear,
    typePlacesFinancesEndYear: endYear,
    activiteStartMonth: startMonth,
    activiteEndMonth: endMonth,
  };
};
