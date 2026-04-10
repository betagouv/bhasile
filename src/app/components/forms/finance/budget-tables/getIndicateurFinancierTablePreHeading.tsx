import { cn } from "@/app/utils/classname.util";

export const getIndicateurFinancierTablePreHeading = ({
  years,
  cutOffYear,
}: Props) => {
  return [
    <th className="bg-white" key="empty" colSpan={1}>
      {" "}
    </th>,
    ...years.map((year) => (
      <th
        scope="col"
        key={year}
        className="bg-white"
        colSpan={year >= cutOffYear ? 2 : 1}
      >
        <span className={cn("block text-sm")}>{year}</span>
      </th>
    )),
  ];
};

type Props = {
  years: number[];
  cutOffYear: number;
};
