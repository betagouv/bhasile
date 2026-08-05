import prettyBytes from "pretty-bytes";

/**
 * Formats a number for display in French locale (without currency symbol)
 * @param value - The number to format
 * @returns Formatted number string (e.g., "1 234,56")
 */
export const formatNumber = (
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }
  return new Intl.NumberFormat("fr-FR", options).format(value);
};

/**
 * Formats a file size for display in French locale
 * @param value - The size in bytes
 * @returns Formatted size string (e.g., "11,8 kB") — the locale drives the
 * decimal separator only, prettyBytes always emits SI units in English
 */
export const formatBytes = (value: number | null | undefined): string =>
  prettyBytes(value ?? 0, { locale: "fr" });

/**
 * Formats a number in compact French notation, for chart axis labels
 * @param value - The number to format
 * @returns Compact number string (e.g., "250 k", "1,5 M")
 */
export const formatCompactNumber = (
  value: number | string | null | undefined
): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0";
  }

  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(Number(value));
};

/**
 * Formats a number as French currency (EUR)
 * @param value - The number to format
 * @returns Formatted currency string (e.g., "1 234,56 €")
 */
export const formatCurrency = (
  value: number | string | null | undefined
): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0 €";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
};

/**
 * Formats a ratio (0-1) as a French percentage
 * @param value - The ratio to format
 * @returns Formatted percentage string (e.g., "97,3 %")
 */
export const formatPercentage = (
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions
): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0 %";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: 2,
    ...options,
  }).format(Number(value));
};

/**
 * Formats a ratio (0-1) as a French per-mille value
 * @param value - The ratio to format
 * @returns Formatted per-mille string (e.g., "1,48 ‰")
 */
export const formatPerMille = (
  value: number | string | null | undefined
): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0\u202f‰";
  }

  return `${formatNumber(Number(value) * 1000, {
    maximumFractionDigits: 2,
  })}\u202f‰`;
};

/**
 * Parses a French-formatted number string back to a number
 * Handles both "1 234,56" and "1234.56" formats
 * @param value - The formatted string to parse
 * @returns The parsed number or null if invalid
 */
export const parseFrenchNumber = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  // Remove currency symbols and all types of spaces (including narrow non-breaking space \u202f)
  let cleaned = String(value).replace(/[€\s\u202f\u00a0]/g, "");

  // Handle French format (comma as decimal separator, space as thousands separator)
  if (cleaned.includes(",")) {
    // Convert comma to dot for decimal separator
    cleaned = cleaned.replace(",", ".");
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};
