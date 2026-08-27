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
