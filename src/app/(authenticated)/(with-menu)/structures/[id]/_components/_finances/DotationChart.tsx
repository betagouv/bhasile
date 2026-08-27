import { ReactElement } from "react";

import { ChartLegend } from "@/app/components/ChartLegend";
import BarChart from "@/app/components/common/BarChart";
import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";

export const DotationChart = ({
  budgets,
  isAutorisee,
  hideStructureTypeLabels = false,
  startYear,
  endYear,
}: Props): ReactElement => {
  const { years } =
    startYear && endYear
      ? getYearRange({
          startYear,
          endYear,
        })
      : getYearRange();

  const yearsWithBudget = years
    .map((year) => {
      return {
        year,
        budget: budgets?.find((budget) => budget.year === year),
      };
    })
    .reverse();

  const getPropertySerie = (propertyName: keyof BudgetApiType): number[] => {
    return (
      yearsWithBudget.map((budget) => Number(budget.budget?.[propertyName])) ||
      []
    );
  };

  const getChartData = () => {
    const labels = yearsWithBudget.map((budget) => budget.year);
    const series = [
      getPropertySerie("dotationDemandee"),
      getPropertySerie("dotationAccordee"),
      getPropertySerie("totalProduits"),
      getPropertySerie("totalCharges"),
    ];
    return {
      labels,
      series,
    };
  };

  const options = {
    seriesBarDistance: 10,
    axisY: { offset: 50 },
    axisX: { showGrid: false },
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
    <div className="grid grid-cols-3 gap-10 print:flex print:flex-col print:gap-8">
      <div className="col-span-2 print:w-full print:flex print:justify-center">
        <BarChart
          data={getChartData()}
          options={options}
          axisYLabel="Montant (€)"
        />
      </div>
      <div className="print:w-full">
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

type Props = {
  budgets: BudgetApiType[] | undefined;
  isAutorisee: boolean;
  hideStructureTypeLabels?: boolean;
  startYear?: number;
  endYear?: number;
};
