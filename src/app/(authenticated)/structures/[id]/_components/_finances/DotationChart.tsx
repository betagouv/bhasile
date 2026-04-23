import { ReactElement } from "react";

import BarChart from "@/app/components/common/BarChart";
import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";

import { useStructureContext } from "../../_context/StructureClientContext";

export const DotationChart = (): ReactElement => {
  const { structure } = useStructureContext();
  const { years } = getYearRange();

  const yearsWithBudget = years
    .map((year) => {
      return {
        year,
        budget: structure.budgets?.find((budget) => budget.year === year),
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

  return (
    <div className="grid grid-cols-3 gap-10">
      <div className="col-span-2">
        <BarChart data={getChartData()} options={options} />
      </div>
      <div>
        <h5 className="text-title-blue-france text-sm font-medium mb-2">
          {structure.isAutorisee
            ? "Fixation de la dotation (dans budget)"
            : "Fixation de la dotation (dans demande subventions)"}
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
          {structure.isAutorisee
            ? "Équilibre économique (dans compte administratif)"
            : "Équilibre économique (dans compte-rendu financier)"}
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
