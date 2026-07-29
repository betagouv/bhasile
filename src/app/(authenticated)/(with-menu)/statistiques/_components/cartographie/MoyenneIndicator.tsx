import { ReactElement } from "react";

export const MoyenneIndicator = ({
  value,
  trend = "up",
}: Props): ReactElement => {
  return (
    <div className="flex flex-col gap-2">
      <span className="uppercase text-xs font-bold text-mention-grey">
        Moyenne
      </span>

      <div className="bg-white rounded-full px-4 py-2 w-fit text-sm">
        <span>{value}</span>
        {trend === "up" ? (
          <span className="fr-icon-arrow-up-line text-title-blue-france" />
        ) : (
          <span className="fr-icon-arrow-down-line text-title-blue-france" />
        )}
      </div>
    </div>
  );
};

type Props = {
  value: number;
  trend?: "up" | "down";
};
