import { ReactElement } from "react";

// import { formatDate } from "@/app/utils/date.util";
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
          <span className="text-title-blue-france mr-3 fr-icon-map-pin-2-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">Finance</h3>
        </div>
        {/* TODO : à mettre à jour quand on aura les campagnes d'actualisation */}
        {/* <div className="flex items-center text-right text-xs text-title-blue-france">
          Données mises à jour le {formatDate(new Date())}
        </div> */}
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
          budgets={statistiques.budgets}
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
