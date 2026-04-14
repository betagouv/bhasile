import { Fragment } from "react";

import { cn } from "@/app/utils/classname.util";
import { INDICATEUR_FINANCIER_CUTOFF_YEAR } from "@/constants";

export const getIndicateurFinancierTableHeading = ({ years }: Props) => {
  return [
    <th key="empty" className="bg-default-grey-hover"></th>,
    ...years.map((year) => (
      <Fragment key={year}>
        {year >= INDICATEUR_FINANCIER_CUTOFF_YEAR && (
          <th className="min-w-28 border-l border-default-grey bg-default-grey-hover !px-0">
            Prévisionnel
          </th>
        )}
        <th
          className={cn(
            "border-default-grey min-w-28 bg-default-grey-hover",
            year >= INDICATEUR_FINANCIER_CUTOFF_YEAR ? "border-r" : "border-x"
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
