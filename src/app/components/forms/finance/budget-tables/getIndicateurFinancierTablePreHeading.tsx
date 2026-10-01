import { getIndicateurFinancierTypes } from "@/app/utils/indicateurFinancier.util";

export const getIndicateurFinancierTablePreHeading = ({ years }: Props) => {
  return [
    <td className="bg-white" key="empty" colSpan={1} />,
    ...years.map((year) => (
      <th
        scope="col"
        key={year}
        className="bg-white border-x border-default-grey"
        colSpan={getIndicateurFinancierTypes(year).length}
      >
        <span className="block text-sm">{year}</span>
      </th>
    )),
  ];
};

type Props = {
  years: number[];
};
