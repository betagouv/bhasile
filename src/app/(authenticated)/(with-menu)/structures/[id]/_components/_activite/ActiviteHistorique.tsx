"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement, useState } from "react";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ActiviteHistoriqueChart } from "./ActiviteHistoriqueChart";
import { ActiviteHistoriqueTable } from "./ActiviteHistoriqueTable";

export const ActiviteHistorique = (): ReactElement => {
  const { structure } = useStructureContext();
  const [visualization, setVisualization] = useState("tableau");

  return (
    <div>
      <div className="flex items-center">
        <h4
          className="text-lg text-title-blue-france pr-6 mb-0"
          id="activite-historique-title"
        >
          Historique
        </h4>
        <SegmentedControl
          small
          legend=""
          inlineLegend
          segments={[
            {
              iconId: "fr-icon-table-line",
              label: "Tableau",
              nativeInputProps: {
                value: "tableau",
                checked: visualization === "tableau",
                onChange: () => setVisualization("tableau"),
              },
            },
            {
              iconId: "fr-icon-line-chart-line",
              label: "Courbe",
              nativeInputProps: {
                value: "courbe",
                checked: visualization === "courbe",
                onChange: () => setVisualization("courbe"),
              },
            },
          ]}
        />
      </div>
      <div className="flex pt-10 pb-4">
        {visualization === "tableau" && (
          <ActiviteHistoriqueTable activites={structure.activites || []} />
        )}
        {visualization === "courbe" && <ActiviteHistoriqueChart />}
      </div>
    </div>
  );
};
