import { ReactElement, ReactNode } from "react";

import { ChartLegend } from "@/app/components/ChartLegend";
import BarChart from "@/app/components/common/BarChart";
import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CompletudeStat } from "@/schemas/api/statistique.schema";
import { getCompletudeChartData } from "@/utils/statistiques.util";

const CHART_OPTIONS = {
  seriesBarDistance: 10,
  axisY: { offset: 50 },
  axisX: { showGrid: false },
};

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

  const yearsWithBudget = years
    .map((year) => ({
      year,
      budget: budgets?.find((budget) => budget.year === year),
    }))
    .reverse();

  const getPropertySerie = (propertyName: keyof BudgetApiType): number[] =>
    yearsWithBudget.map((budget) => Number(budget.budget?.[propertyName] ?? 0));

  const chartData = {
    labels: yearsWithBudget.map((budget) => budget.year.toString()),
    series: [
      getPropertySerie("dotationDemandee"),
      getPropertySerie("dotationAccordee"),
      getPropertySerie("totalProduits"),
      getPropertySerie("totalCharges"),
    ],
    ...getCompletudeChartData(
      yearsWithBudget.map((budget) => budget.budget?.completude)
    ),
  };

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
          options={CHART_OPTIONS}
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
  nbRenseignees: number[];
  percentages: string[];
};

type Props = {
  budgets: (BudgetApiType & { completude?: CompletudeStat | null })[] | undefined;
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
