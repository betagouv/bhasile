import { formatNumber } from "@/app/utils/number.util";

/**
 * Displays a number as formatted French number or currency (EUR).
 * @param value - The number to display as number or currency
 * @param type - The type of the number to display ("number" or "currency")
 * @param showZero - If false, displays "-" for zero/null/undefined values
 * @param className - Optional CSS class for the span
 * @param compact - Optional boolean to display in k or M (ex : 10000 => 10k)
 * @param maximumFractionDigits - Optional maximum number of decimals (ex : 0 => 1 815 873 €)
 */

export const NumberDisplay = ({
  value,
  type = "number",
  showZero = true,
  className,
  compact = false,
  maximumFractionDigits,
}: Props) => {
  if (!showZero && (value === 0 || value === null || value === undefined)) {
    return <span className={className}>-</span>;
  }

  const valueToDisplay = formatNumber(value ?? 0, {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits,
    ...(type === "currency" ? { style: "currency", currency: "EUR" } : {}),
  });

  return <span className={className}>{valueToDisplay}</span>;
};

type Props = {
  value: number | string | null | undefined;
  type?: "number" | "currency";
  className?: string;
  showZero?: boolean;
  compact?: boolean;
  maximumFractionDigits?: number;
};
