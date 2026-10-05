import { ReactElement, useMemo } from "react";

import { ChartLegend } from "@/app/components/ChartLegend";
import { StackedBarLineChart } from "@/app/components/common/StackedBarLineChart";
import { getYearRange } from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";
import { FinanceByYearScopeStat } from "@/schemas/api/statistique.schema";

import { ClosedStructuresDisclaimer } from "../ClosedStructuresDisclaimer";
import { FinanceChartLabel } from "./FinanceChartLabel";

export const BalanceChart = ({ startYear, endYear }: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const { years } =
    startYear && endYear
      ? getYearRange({
          startYear,
          endYear,
        })
      : getYearRange();

  const yearsWithBudget = useMemo(
    () =>
      years
        .map((year) => ({
          year,
          budget: statistiques.finance.byYear?.find(
            (budget) => budget.year === year
          ),
        }))
        .reverse(),
    [years, statistiques.finance.byYear]
  );

  const chartData = useMemo(() => {
    const getPropertySerie = (
      propertyName: keyof FinanceByYearScopeStat
    ): number[] => {
      return (
        yearsWithBudget.map((budget) =>
          Number(
            budget.budget?.total[
              propertyName as keyof FinanceByYearScopeStat
            ] ?? 0
          )
        ) || []
      );
    };

    const labels = yearsWithBudget.map((budget) => budget.year.toString());
    const excedentCumule = getPropertySerie("excedentCumule");
    const deficitCumuleBrut = getPropertySerie("deficitCumule");
    const cumul = excedentCumule.map(
      (excedent, index) => excedent - deficitCumuleBrut[index]
    );
    const deficitCumuleNegatif = deficitCumuleBrut.map(
      (deficit) => -Math.abs(deficit)
    );

    const incompleteYears = yearsWithBudget.map((budget) => {
      const yearNumber = budget.year;
      return (
        !Number.isNaN(yearNumber) &&
        yearNumber >= CURRENT_YEAR - 2 &&
        yearNumber <= CURRENT_YEAR
      );
    });

    return {
      labels,
      barsSeries: [excedentCumule, deficitCumuleNegatif],
      lineSeries: cumul,
      incompleteYears,
    };
  }, [yearsWithBudget]);

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
            data={chartData}
            colors={colors}
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
