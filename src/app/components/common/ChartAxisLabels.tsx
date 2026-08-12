import { ReactElement } from "react";

export const ChartAxisLabels = ({
  startLabel,
  endLabel,
}: Props): ReactElement | null => {
  if (!startLabel && !endLabel) {
    return null;
  }

  return (
    <div className="flex justify-between text-xs text-mention-grey mb-1">
      <span>{startLabel}</span>
      <span>{endLabel}</span>
    </div>
  );
};

type Props = {
  startLabel?: string;
  endLabel?: string;
};
