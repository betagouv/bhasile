import { ReactElement, useMemo } from "react";

import { ChartLegend } from "@/app/components/ChartLegend";
import { StackedBarLineChart } from "@/app/components/common/StackedBarLineChart";
import { getYearRange } from "@/app/utils/date.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";
import { FinanceByYearScopeStat } from "@/schemas/api/statistique.schema";

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
        Excédents et déficits cumulés
      </h4>
      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2">
          <StackedBarLineChart
            data={getChartData()}
            colors={colors}
            axisYLabel="Montant (€)"
          />
        </div>
        <div>
          <ChartLegend label="Excédents" color="#18753CB2" />
          <ChartLegend label="Déficits" color="#CE0500B2" />
          <ChartLegend
            label="Cumul des montants des déficits et excédents"
            color="var(--border-action-high-blue-france)"
            type="line"
          />
        </div>
      </div>
    </>
  );
};
