import { Fragment } from "react";

import { INDICATEUR_FINANCIER_CUTOFF_YEAR } from "@/constants";

export const getIndicateurFinancierTableHeading = ({ years }: Props) => {
  return [
    <th key="empty"></th>,
    ...years.map((year) => (
      <Fragment key={year}>
        {year >= INDICATEUR_FINANCIER_CUTOFF_YEAR && <th>Prévisionnel</th>}
        <th>Réalisé</th>
      </Fragment>
    )),
  ];
};

type Props = {
  years: number[];
};
