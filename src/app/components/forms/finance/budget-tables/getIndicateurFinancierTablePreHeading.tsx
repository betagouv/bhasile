import { getIndicateurFinancierTypes } from "@/app/utils/indicateur-financier.util";

import { CpomYearBadge } from "./CpomYearBadge";

export const getIndicateurFinancierTablePreHeading = ({
  years,
  isInCpomPerYear,
}: Props) => {
  return [
    <td className="bg-white" key="empty" colSpan={1} />,
    ...years.map((year) => (
      <th
        scope="col"
        key={year}
        className="bg-white border-x border-default-grey"
        colSpan={getIndicateurFinancierTypes(year).length}
      >
        <span className="block text-sm mb-1">{year}</span>
        <CpomYearBadge isInCpom={isInCpomPerYear[year]} />
      </th>
    )),
  ];
};

type Props = {
  years: number[];
  isInCpomPerYear: Record<number, boolean>;
};
