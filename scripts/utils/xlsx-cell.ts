export function normalizeCellValue(val: unknown): string {
  if (val == null) {
    return "";
  }
  return String(val).trim();
}
