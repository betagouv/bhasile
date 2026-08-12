import { ReactElement } from "react";

export const ChartLegend = ({
  label,
  color,
  type = "square",
}: Props): ReactElement => {
  return (
    <div className="flex items-center pb-2">
      {type === "square" && (
        <div
          className="h-3 w-3 shrink-0 grow-0"
          style={{ backgroundColor: color }}
        />
      )}
      {type === "line" && (
        <div
          className="w-10 border-b-2 shrink-0 grow-0"
          style={{ borderColor: color }}
        />
      )}
      <p className="pl-2 mb-0">{label}</p>
    </div>
  );
};

type Props = {
  label: string;
  color: string;
  type?: "square" | "line";
};
