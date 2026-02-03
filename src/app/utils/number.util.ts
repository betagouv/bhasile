/**
 * Formats a number for display in French locale (without currency symbol)
 * @param value - The number to format
 * @returns Formatted number string (e.g., "1 234,56")
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }
  return new Intl.NumberFormat("fr-FR").format(value);
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
 * Parses a French-formatted number string back to a number
 * Handles both "1 234,56" and "1234.56" formats
 * @param value - The formatted string to parse
 * @returns The parsed number or null if invalid
 */
export const parseFrenchNumber = (value: string): number | null => {
  if (!value || typeof value !== "string") {
    return null;
  }

  // Remove currency symbols and all types of spaces (including narrow non-breaking space \u202f)
  let cleaned = value.replace(/[€\s\u202f\u00a0]/g, "");

  // Handle French format (comma as decimal separator, space as thousands separator)
  if (cleaned.includes(",")) {
    // Convert comma to dot for decimal separator
    cleaned = cleaned.replace(",", ".");
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};
