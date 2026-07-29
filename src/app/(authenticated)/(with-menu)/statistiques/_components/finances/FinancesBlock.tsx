"use client";

import { ReactElement } from "react";

import { DOCUMENTS_FINANCIERS_OPEN_YEAR } from "@/constants";

import { DotationChart } from "../../../structures/[id]/_components/_finances/DotationChart";
import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";
import { BalanceChart } from "./BalanceChart";
import { FinanceCards } from "./FinanceCards";
import { FinancesStatsTable } from "./FinancesStatsTable";

export const FinancesBlock = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className="text-title-blue-france mr-3 fr-icon-money-euro-box-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">Finance</h3>
        </div>
      </div>
      <h4 className="text-title-blue-france text-lg">
        Budgets exécutoires pour {DOCUMENTS_FINANCIERS_OPEN_YEAR}
      </h4>
      <div className="flex pb-16">
        <FinanceCards />
      </div>
      <h4 className="text-title-blue-france text-lg">
        Dotation et équilibre économique
      </h4>
      <div className="pb-12">
        <DotationChart
          budgets={statistiques.finance.byYear.map((yearItem) => ({
            year: yearItem.year,
            ...yearItem.total,
          }))}
          isAutorisee={false}
          hideStructureTypeLabels={true}
        />
      </div>
      <div className="pb-12">
        <BalanceChart />
      </div>
      <FinancesStatsTable />
    </div>
  );
};
