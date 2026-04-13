import { Badge } from "@/app/components/common/Badge";
import { cn } from "@/app/utils/classname.util";
import { isYearRealisee } from "@/app/utils/indicateurFinancier.util";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";

export const getIndicateurFinancierStaticTableHeading = ({
  years,
  indicateursFinanciers,
}: Props) => {
  return [
    <th className="bg-white" key="empty">
      {" "}
    </th>,
    ...years.map((year) => (
      <th scope="col" key={year} className="bg-white">
        <span className={cn("block text-sm")}>{year}</span>
        {isYearRealisee(indicateursFinanciers, year) ? (
          <Badge type="new" className="text-[10px]">
            Réalisé
          </Badge>
        ) : (
          <Badge type="disabled" className="text-[10px]">
            Prévisionnel
          </Badge>
        )}
      </th>
    )),
  ];
};

type Props = {
  years: number[];
  indicateursFinanciers: IndicateurFinancierApiType[];
};
