"use client";

import { sendEvent } from "@socialgouv/matomo-next";
import dynamic from "next/dynamic";
import { ReactElement, useMemo, useState } from "react";

import { SegmentedControl } from "@/app/components/common/SegmentedControl";
import { ListLoader } from "@/app/components/lists/ListLoader";
import { usePersistStructuresSearchQuery } from "@/app/hooks/usePersistStructuresSearchQuery";
import { useStructuresSearch } from "@/app/hooks/useStructuresSearch";

import { Filters } from "../../../components/filters/Filters";
import { SearchBar } from "./_components/SearchBar";
import { StructuresTable } from "./_components/StructuresTable";

export default function Structures(): ReactElement {
  const [selectedVisualization, setSelectedVisualization] = useState("tableau");

  usePersistStructuresSearchQuery();

  const { structures, totalStructures } = useStructuresSearch({ map: false });

  const StructuresMap = useMemo(
    () =>
      dynamic(() => import("./_components/StructuresMap"), {
        loading: () => (
          <p className="h-full w-full flex items-center justify-center">
            Chargement de la carte en cours...
          </p>
        ),
        ssr: false,
      }),
    []
  );

  return (
    <div className="h-full w-full flex flex-col bg-alt-grey">
      <div className="flex gap-2 px-6 border-b border-b-border-default-grey min-h-[4.35rem] justify-between items-center sticky top-0 bg-lifted-grey z-10">
        <SegmentedControl
          name="Visualisation"
          options={options}
          onChange={(event) => {
            setSelectedVisualization(event);
            sendEvent({ category: "visualisation", action: event });
          }}
        >
          <h2
            className="text-title-blue-france fr-h5 mr-4 mb-0"
            id="structures-titre"
          >
            Structures d’hébergement
          </h2>
        </SegmentedControl>
      </div>
      <div className="flex gap-2 justify-end items-center py-3.5 px-6 z-2">
        <SearchBar placeholder="Code ou commune" inputId="structures-search" />
        <Filters />
        <p className="pl-3 text-mention-grey mb-0 min-w-24 text-right">
          {totalStructures ?? 0} entrée
          {(totalStructures ?? 0) > 1 ? "s" : ""}
        </p>
      </div>
      {selectedVisualization === "tableau" && (
        <ListLoader
          fetchStateName={"structure-search"}
          items={structures}
          entityName="structure"
        >
          {structures && (
            <StructuresTable
              structures={structures}
              totalStructures={totalStructures}
              ariaLabelledBy="structures-titre"
            />
          )}
        </ListLoader>
      )}
      {selectedVisualization === "carte" && <StructuresMap />}
    </div>
  );
}

const options = [
  {
    id: "tableau",
    isChecked: true,
    label: "Tableau",
    value: "tableau",
    icon: "fr-icon-survey-line",
  },
  {
    id: "carte",
    isChecked: false,
    label: "Carte",
    value: "carte",
    icon: "fr-icon-road-map-line",
  },
];
