import { cn } from "@/app/utils/classname.util";
import { INDICATEUR_FINANCIER_CUTOFF_YEAR } from "@/constants";

export const getIndicateurFinancierTablePreHeading = ({ years }: Props) => {
  return [
    <td className="bg-white" key="empty" colSpan={1} />,
    ...years.map((year) => (
      <th
        scope="col"
        key={year}
        className="bg-white border-x border-default-grey"
        colSpan={year >= INDICATEUR_FINANCIER_CUTOFF_YEAR ? 2 : 1}
      >
        <span className={cn("block text-sm")}>{year}</span>
      </th>
    )),
  ];
};

type Props = {
  years: number[];
};
