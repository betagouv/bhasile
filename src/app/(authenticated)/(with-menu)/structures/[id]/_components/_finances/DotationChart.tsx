import { ReactElement } from "react";

import BarChart from "@/app/components/common/BarChart";
import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";

export const DotationChart = ({
  budgets,
  isAutorisee,
  hideStructureTypeLabels = false,
}: Props): ReactElement => {
  const { years } = getYearRange();

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
    axisY: {
      offset: 70,
      labelInterpolationFnc: (value: number) => value.toLocaleString(),
    },
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
    <div className="grid grid-cols-3 gap-10">
      <div className="col-span-2">
        <BarChart data={getChartData()} options={options} />
      </div>
      <div>
        <h5 className="text-title-blue-france text-sm font-medium mb-2">
          {getDotationLabel()}
        </h5>
        <div className="flex items-center mb-2">
          <div className="h-3 w-3 bg-(--yellow-moutarde-850-200)" />
          <p className="pl-2 mb-0">Dotation demandée par l’opérateur</p>
        </div>
        <div className="flex items-center pb-6">
          <div className="h-3 w-3 bg-(--yellow-moutarde-main-679)" />
          <p className="pl-2 mb-0">Dotation totale accordée par l’État</p>
        </div>
        <h5 className="text-title-blue-france text-sm font-medium  mb-2">
          {getEquilibreEconomiqueLabel()}
        </h5>
        <div className="flex items-center mb-2">
          <div className="h-3 w-3 bg-(--purple-glycine-850-200)" />
          <p className="pl-2 mb-0">Total des produits (dont dotation État)</p>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 bg-(--blue-cumulus-850-200)" />
          <p className="pl-2 mb-0">Total des charges retenues</p>
        </div>
      </div>
    </div>
  );
};

type Props = {
  budgets: BudgetApiType[] | undefined;
  isAutorisee: boolean;
  hideStructureTypeLabels?: boolean;
};
