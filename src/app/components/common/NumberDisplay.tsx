/**
 * Displays a number as formatted French number or currency (EUR).
 * @param value - The number to display as number or currency
 * @param type - The type of the number to display ("number" or "currency")
 * @param showZero - If false, displays "-" for zero/null/undefined values
 * @param className - Optional CSS class for the span
 */

import { formatCurrency, formatNumber } from "@/app/utils/number.util";

export const NumberDisplay = ({
  value,
  type = "number",
  showZero = true,
  className,
}: CurrencyDisplayProps) => {
  if (!showZero && (value === 0 || value === null || value === undefined)) {
    return <span className={className}>-</span>;
  }

  const valueToDisplay =
    type === "number" ? formatNumber(Number(value)) : formatCurrency(value);

  return <span className={className}>{valueToDisplay}</span>;
};

type CurrencyDisplayProps = {
  value: number | string | null | undefined;
  type?: "number" | "currency";
  className?: string;
  showZero?: boolean;
};
