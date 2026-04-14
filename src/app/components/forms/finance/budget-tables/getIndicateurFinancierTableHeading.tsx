import { Fragment } from "react";

import { cn } from "@/app/utils/classname.util";
import { INDICATEUR_FINANCIER_CUTOFF_YEAR } from "@/constants";

export const getIndicateurFinancierTableHeading = ({ years }: Props) => {
  return [
    <th key="empty"></th>,
    ...years.map((year) => (
      <Fragment key={year}>
        {year >= INDICATEUR_FINANCIER_CUTOFF_YEAR && (
          <th className="border-l border-default-grey">Prévisionnel</th>
        )}
        <th
          className={cn(
            "border-default-grey",
            "border-r ",
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
