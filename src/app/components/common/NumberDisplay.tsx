/**
 * Displays a number as formatted French number or currency (EUR).
 * @param value - The number to display as number or currency
 * @param type - The type of the number to display ("number" or "currency")
 * @param showZero - If false, displays "-" for zero/null/undefined values
 * @param className - Optional CSS class for the span
 * @param compact - Optional boolean to display in k or M (ex : 10000 => 10k)
 */

export const NumberDisplay = ({
  value,
  type = "number",
  showZero = true,
  className,
  compact = false,
}: Props) => {
  if (!showZero && (value === 0 || value === null || value === undefined)) {
    return <span className={className}>-</span>;
  }

  const numericValue =
    value === null || value === undefined ? 0 : Number(value);

  const options: Intl.NumberFormatOptions = {
    notation: compact ? "compact" : "standard",
  };

  if (type === "currency") {
    options.style = "currency";
    options.currency = "EUR";
  }

  const valueToDisplay = new Intl.NumberFormat("fr-FR", options).format(
    numericValue
  );

  return <span className={className}>{valueToDisplay}</span>;
};

type Props = {
  value: number | string | null | undefined;
  type?: "number" | "currency";
  className?: string;
  showZero?: boolean;
  compact?: boolean;
};
