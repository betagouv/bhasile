import { Fragment } from "react";

import { cn } from "@/app/utils/classname.util";
import { getIndicateurFinancierTypes } from "@/app/utils/indicateurFinancier.util";

export const getIndicateurFinancierTableHeading = ({ years }: Props) => {
  return [
    <td key="empty" className="bg-default-grey-hover" />,
    ...years.map((year) => {
      const types = getIndicateurFinancierTypes(year);
      return (
        <Fragment key={year}>
          {types.map((type, index) => (
            <th
              key={type}
              className={cn(
                "min-w-28 border-default-grey bg-default-grey-hover",
                index === 0 && "border-l !px-0",
                index === types.length - 1 && "border-r"
              )}
            >
              {type === "PREVISIONNEL" ? "Prévisionnel" : "Réalisé"}
            </th>
          ))}
        </Fragment>
      );
    }),
  ];
};

type Props = {
  years: number[];
};
