import { ReactElement, useMemo } from "react";

import { StackedBarLineChart } from "@/app/components/common/StackedBarLineChart";
import { getYearRange } from "@/app/utils/date.util";
import { FinanceByYearScopeStat } from "@/schemas/api/statistique.schema";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const BalanceChart = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const { years } = getYearRange();

  const yearsWithBudget = years
    .map((year) => {
      return {
        year,
        budget: statistiques.finance.byYear?.find(
          (budget) => budget.year === year
        ),
      };
    })
    .reverse();

  const getPropertySerie = (
    propertyName: keyof FinanceByYearScopeStat
  ): number[] => {
    return (
      yearsWithBudget.map((budget) =>
        Number(
          budget.budget?.total[propertyName as keyof FinanceByYearScopeStat]
        )
      ) || []
    );
  };

  const getChartData = () => {
    const labels = yearsWithBudget.map((budget) => budget.year.toString());
    const excendentCumule = getPropertySerie("excedentCumule");
    const deficitCumuleBrut = getPropertySerie("deficitCumule");
    const cumul = excendentCumule.map(
      (excedent, index) => excedent - deficitCumuleBrut[index]
    );
    const deficitCumuleNegatif = deficitCumuleBrut.map(
      (deficit) => -Math.abs(deficit)
    );

    const series = {
      barsSeries: [excendentCumule, deficitCumuleNegatif],
      lineSeries: cumul,
    };

    return {
      labels,
      ...series,
    };
  };

  const colors = useMemo(
    () => ({
      bars: ["#18753CB2", "#CE0500B2"],
      line: "var(--blue-france-sun-113-625)",
    }),
    []
  );

  return (
    <>
      <h4 className="text-title-blue-france text-lg" id="structure-stats-table">
        Excédent et déficit cumulé
      </h4>
      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2">
          <StackedBarLineChart data={getChartData()} colors={colors} />
        </div>
        <div>
          <div className="flex items-center pb-6">
            <div className="h-3 w-3 bg-[#18753CB2]" />
            <p className="pl-2 mb-0">Excédents</p>
          </div>
          <div className="flex items-center pb-6">
            <div className="h-3 w-3 bg-[#CE0500B2]" />
            <p className="pl-2 mb-0">Déficits</p>
          </div>
          <div className="pb-2 flex items-center">
            <div className="w-[40px] border-b-2 border-b-action-high-blue-france mr-2 shrink-0 grow-0" />
            Cumul des montants des déficits et excédents
          </div>
        </div>
      </div>
    </>
  );
};
