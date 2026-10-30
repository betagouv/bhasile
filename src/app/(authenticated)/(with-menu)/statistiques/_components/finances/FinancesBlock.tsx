"use client";

import { ReactElement } from "react";

import { getPercentage } from "@/app/utils/common.util";
import { getCurrentYear } from "@/app/utils/now.util";
import { isYearIncomplete } from "@/app/utils/statistiques-period.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

import { DotationChart } from "../../../structures/[id]/_components/_finances/DotationChart";
import { ClosedStructuresDisclaimer } from "../ClosedStructuresDisclaimer";
import { IncompleteDataIndicator } from "../IncompleteDataIndicator";
import { BalanceChart } from "./BalanceChart";
import { FinanceCards } from "./FinanceCards";
import { FinanceChartLabel } from "./FinanceChartLabel";
import { FinancesStatsTable } from "./FinancesStatsTable";

export const FinancesBlock = ({ startYear, endYear }: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const completude = statistiques.finance.byYear.find(
    (yearItem) => yearItem.year === getCurrentYear()
  )?.total.completude;
  const nbStructures = completude?.nbRenseignees ?? 0;

  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className="text-title-blue-france mr-3 fr-icon-money-euro-box-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">Finance</h3>
        </div>
      </div>
      <h4 className="text-title-blue-france text-lg print:mb-0">
        Budgets exécutoires pour {getCurrentYear()}{" "}
        {isYearIncomplete(completude) && (
          <IncompleteDataIndicator
            nbStructures={nbStructures}
            structuresPercentage={getPercentage(
              nbStructures,
              completude?.nbAttendues ?? 1
            )}
          />
        )}
      </h4>
      {isYearIncomplete(completude) && (
        <h5 className="hidden print:block text-title-blue-france text-sm font-normal">
          {nbStructures} structures actualisées
        </h5>
      )}
      <div className="flex pb-16">
        <FinanceCards />
      </div>
      <div className="break-inside-avoid">
        <h4 className="text-title-blue-france text-lg">
          Dotations et équilibres économiques
        </h4>
        <DotationChart
          budgets={statistiques.finance.byYear.map((yearItem) => ({
            year: yearItem.year,
            ...yearItem.total,
          }))}
          isAutorisee={false}
          hideStructureTypeLabels={true}
          startYear={startYear}
          endYear={endYear}
          showIncompleteYears={true}
          renderLabel={(label, index, chartData) => (
            <FinanceChartLabel
              chartData={chartData}
              label={label}
              index={index}
            />
          )}
        />
        <ClosedStructuresDisclaimer />
      </div>
      <div className="py-12 break-inside-avoid">
        <BalanceChart startYear={startYear} endYear={endYear} />
      </div>
      <FinancesStatsTable startYear={startYear} endYear={endYear} />
    </div>
  );
};

type Props = {
  startYear?: number;
  endYear?: number;
};
