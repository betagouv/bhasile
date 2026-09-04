"use client";

import { ReactElement, useState } from "react";

import { useExportContext } from "@/contexts/ExportContext"; // Ajustez selon le chemin de votre contexte

import { FinancesTablePresenter } from "./FinancesTablePresenter";
import { FinanceTypeSelector } from "./FinanceTypeSelector";

const PRINT_SECTIONS: {
  key: "total" | "autorisees" | "subventionnees";
  title: string;
}[] = [
  { key: "total", title: "Toutes les structures" },
  { key: "autorisees", title: "Structures autorisées" },
  { key: "subventionnees", title: "Structures subventionnées" },
];

export const FinancesStatsTable = ({
  startYear,
  endYear,
}: Props): ReactElement => {
  const isExporting = useExportContext();
  const [visualization, setVisualization] = useState<
    "total" | "autorisees" | "subventionnees"
  >("total");

  if (isExporting) {
    return (
      <div className="space-y-8">
        {PRINT_SECTIONS.map((section) => (
          <div key={section.key} className="space-y-3">
            <h3 className="text-md font-bold text-title-blue-france">
              Tableau de données ({section.title})
            </h3>
            <FinancesTablePresenter
              visualization={section.key}
              tableId={`finances-stats-table-${section.key}`}
              startYear={startYear}
              endYear={endYear}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex">
        <h4
          className="text-title-blue-france text-lg pr-4"
          id="finances-stats-table"
        >
          Tableau de données
        </h4>
        <FinanceTypeSelector
          visualization={visualization}
          setVisualization={setVisualization}
        />
      </div>
      <FinancesTablePresenter visualization={visualization} />
    </div>
  );
};

type Props = {
  startYear?: number;
  endYear?: number;
};
