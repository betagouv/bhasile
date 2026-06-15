export const getMonthKey = (date: Date): string =>
  date.toISOString().slice(0, 7);

export const monthKeyToDate = (key: string): Date => new Date(`${key}-01`);

export const getMonthKeysFromDates = (dates: Date[]): string[] =>
  [...new Set(dates.map(getMonthKey))].sort();
