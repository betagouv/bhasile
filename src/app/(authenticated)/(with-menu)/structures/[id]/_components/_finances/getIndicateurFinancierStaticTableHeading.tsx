import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { CpomYearBadge } from "@/app/components/forms/finance/budget-tables/CpomYearBadge";
import { cn } from "@/app/utils/classname.util";
import { isYearRealisee } from "@/app/utils/indicateur-financier.util";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";

export const getIndicateurFinancierStaticTableHeading = ({
  years,
  indicateursFinanciers,
  isInCpomPerYear,
}: Props): ReactElement[] => {
  return [
    <td className="bg-white" key="empty" />,
    ...years.map((year) => (
      <th scope="col" key={year} className="bg-white">
        <span className={cn("block text-sm")}>{year}</span>
        <span className="flex flex-col items-center gap-1">
          {isYearRealisee(indicateursFinanciers, year) ? (
            <Badge type="new" className="text-[10px]">
              Réalisé
            </Badge>
          ) : (
            <Badge type="disabled" className="text-[10px]">
              Prévisionnel
            </Badge>
          )}
          <CpomYearBadge isInCpom={isInCpomPerYear[year]} />
        </span>
      </th>
    )),
  ];
};

type Props = {
  years: number[];
  indicateursFinanciers: IndicateurFinancierApiType[];
  isInCpomPerYear: Record<number, boolean>;
};
