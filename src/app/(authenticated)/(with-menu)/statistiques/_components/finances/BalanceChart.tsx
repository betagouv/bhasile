import { ReactElement } from "react";

import { ChartLegend } from "@/app/components/ChartLegend";
import { StackedBarLineChart } from "@/app/components/common/StackedBarLineChart";
import { getYearRange } from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";
import { FinanceByYearScopeStat } from "@/schemas/api/statistique.schema";
import { getCompletudeChartData } from "@/utils/statistiques.util";

import { ClosedStructuresDisclaimer } from "../ClosedStructuresDisclaimer";
import { FinanceChartLabel } from "./FinanceChartLabel";

const CHART_COLORS = {
  bars: ["#18753CB2", "#CE0500B2"],
  line: "var(--blue-france-sun-113-625)",
};

export const BalanceChart = ({ startYear, endYear }: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const { years } =
    startYear && endYear
      ? getYearRange({
          startYear,
          endYear,
        })
      : getYearRange();

  const yearsWithBudget = years
    .filter((year) => year < CURRENT_YEAR)
    .map((year) => ({
      year,
      budget: statistiques.finance.byYear.find(
        (budget) => budget.year === year
      ),
    }))
    .reverse();

  const getPropertySerie = (propertyName: keyof FinanceByYearScopeStat) =>
    yearsWithBudget.map((budget) =>
      Number(budget.budget?.total[propertyName] ?? 0)
    );

  const excedentCumule = getPropertySerie("excedentCumule");
  const deficitCumule = getPropertySerie("deficitCumule");
  const chartData = {
    labels: yearsWithBudget.map((budget) => budget.year.toString()),
    barsSeries: [excedentCumule, deficitCumule.map((deficit) => -deficit)],
    lineSeries: excedentCumule.map(
      (excedent, index) => excedent - deficitCumule[index]
    ),
    ...getCompletudeChartData(
      yearsWithBudget.map((budget) => budget.budget?.total.completude)
    ),
  };

  return (
    <>
      <h4 className="text-title-blue-france text-lg" id="structure-stats-table">
        Excédents et déficits cumulés
      </h4>
      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2">
          <StackedBarLineChart
            data={chartData}
            colors={CHART_COLORS}
            axisYLabel="Montant (€)"
            renderLabel={(label, index) => (
              <FinanceChartLabel
                chartData={chartData}
                label={label}
                index={index}
              />
            )}
          />
          <ClosedStructuresDisclaimer />
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

type Props = {
  startYear?: number;
  endYear?: number;
};
