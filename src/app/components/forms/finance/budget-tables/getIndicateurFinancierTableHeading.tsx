import { Fragment } from "react";

import { cn } from "@/app/utils/classname.util";
import { INDICATEUR_FINANCIER_PREVISIONNEL_START_YEAR } from "@/constants";

export const getIndicateurFinancierTableHeading = ({ years }: Props) => {
  return [
    <td key="empty" className="bg-default-grey-hover" />,
    ...years.map((year) => (
      <Fragment key={year}>
        {year >= INDICATEUR_FINANCIER_PREVISIONNEL_START_YEAR && (
          <th className="min-w-28 border-l border-default-grey bg-default-grey-hover !px-0">
            Prévisionnel
          </th>
        )}
        <th
          className={cn(
            "border-default-grey min-w-28 bg-default-grey-hover",
            year >= INDICATEUR_FINANCIER_PREVISIONNEL_START_YEAR ? "border-r" : "border-x"
          )}
        >
          Réalisé
        </th>
      </Fragment>
    )),
  ];
};

type Props = {
  years: number[];
};
