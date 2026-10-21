import { ReactElement, ReactNode, useMemo } from "react";

import { ChartLegend } from "@/app/components/ChartLegend";
import BarChart from "@/app/components/common/BarChart";
import { getYearRange } from "@/app/utils/date.util";
import { isYearIncomplete } from "@/app/utils/statistiques-period.util";
import { CURRENT_YEAR } from "@/constants";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CompletudeStat } from "@/schemas/api/statistique.schema";

export const DotationChart = ({
  budgets,
  isAutorisee,
  hideStructureTypeLabels = false,
  startYear,
  endYear,
  showIncompleteYears = false,
  renderLabel,
}: Props): ReactElement => {
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
        .filter((year) => year < CURRENT_YEAR)
        .map((year) => ({
          year,
          budget: budgets?.find((budget) => budget.year === year),
        }))
        .reverse(),
    [years, budgets]
  );

  const chartData = useMemo(() => {
    const getPropertySerie = (propertyName: keyof BudgetApiType): number[] => {
      return (
        yearsWithBudget.map((budget) =>
          Number(budget.budget?.[propertyName] ?? 0)
        ) || []
      );
    };

    const labels = yearsWithBudget.map((budget) => budget.year.toString());
    const series = [
      getPropertySerie("dotationDemandee"),
      getPropertySerie("dotationAccordee"),
      getPropertySerie("totalProduits"),
      getPropertySerie("totalCharges"),
    ];

    const incompleteYears = yearsWithBudget.map((budget) => {
      const typedBudget = budget.budget as BudgetApiType & {
        completude?: CompletudeStat;
      };
      return isYearIncomplete(typedBudget.completude);
    });

    return {
      labels,
      series,
      incompleteYears,
    };
  }, [yearsWithBudget]);

  const options = useMemo(
    () => ({
      seriesBarDistance: 10,
      axisY: { offset: 50 },
      axisX: { showGrid: false },
    }),
    []
  );

  const getDotationLabel = (): string => {
    if (hideStructureTypeLabels) {
      return "Fixation de la dotation";
    }
    return isAutorisee
      ? "Fixation de la dotation (dans budget)"
      : "Fixation de la dotation (dans demande subventions)";
  };

  const getEquilibreEconomiqueLabel = (): string => {
    if (hideStructureTypeLabels) {
      return "Équilibre économique";
    }
    return isAutorisee
      ? "Équilibre économique (dans compte administratif)"
      : "Équilibre économique (dans compte-rendu financier)";
  };

  return (
    <div className="grid grid-cols-3 gap-10">
      <div className="col-span-2">
        <BarChart
          data={chartData}
          options={options}
          axisYLabel="Montant (€)"
          incompleteYears={
            showIncompleteYears ? chartData.incompleteYears : undefined
          }
          renderLabel={
            renderLabel
              ? (label, index) => renderLabel(label, index, chartData)
              : undefined
          }
        />
      </div>
      <div className="break-inside-avoid">
        <h5 className="text-title-blue-france text-sm font-medium mb-2">
          {getDotationLabel()}
        </h5>
        <ChartLegend
          label="Dotation demandée par l’opérateur"
          color="var(--yellow-moutarde-850-200)"
        />
        <ChartLegend
          label="Dotation totale accordée par l’État"
          color="var(--yellow-moutarde-main-679)"
        />
        <h5 className="text-title-blue-france text-sm font-medium mb-2 mt-6">
          {getEquilibreEconomiqueLabel()}
        </h5>
        <ChartLegend
          label="Total des produits (dont dotation État)"
          color="var(--purple-glycine-850-200)"
        />
        <ChartLegend
          label="Total des charges retenues"
          color="var(--blue-cumulus-850-200)"
        />
      </div>
    </div>
  );
};

export type DotationChartData = {
  labels: string[];
  series: number[][];
  incompleteYears: boolean[];
};

type Props = {
  budgets: BudgetApiType[] | undefined;
  isAutorisee: boolean;
  hideStructureTypeLabels?: boolean;
  startYear?: number;
  endYear?: number;
  showIncompleteYears?: boolean;
  renderLabel?: (
    label: string,
    index: number,
    chartData: DotationChartData
  ) => ReactNode;
};
