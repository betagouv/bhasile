"use client";

import { sendEvent } from "@socialgouv/matomo-next";
import dynamic from "next/dynamic";
import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";

import { SegmentedControl } from "@/app/components/common/SegmentedControl";
import { Filters } from "@/app/components/filters/Filters";
import { ListLoader } from "@/app/components/lists/ListLoader";
import { SearchBar } from "@/app/components/SearchBar";
import { usePersistStructuresSearchQuery } from "@/app/hooks/usePersistStructuresSearchQuery";
import { useStructuresSearch } from "@/app/hooks/useStructuresSearch";

import { StructuresTable } from "./_components/StructuresTable";
import { Toolbar } from "./_components/Toolbar";

type Visualization = "tableau" | "carte";

export default function Structures(): ReactElement {
  const [selectedVisualization, setSelectedVisualization] =
    useState<Visualization>(() => {
      // Safe value, necessary for build
      if (typeof window === "undefined") {
        return "tableau";
      }
      const anchor = window.location.hash.replace("#", "");
      return anchor === "carte" ? "carte" : "tableau";
    });

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

  const setVisualization = useCallback((next: "tableau" | "carte") => {
    setSelectedVisualization(next);
    sendEvent({ category: "visualisation", action: next });
    window.location.hash = next;
  }, []);

  const options = useMemo(
    () => [
      {
        id: "tableau",
        isChecked: selectedVisualization === "tableau",
        label: "Tableau",
        value: "tableau",
        icon: "fr-icon-survey-line",
      },
      {
        id: "carte",
        isChecked: selectedVisualization === "carte",
        label: "Carte",
        value: "carte",
        icon: "fr-icon-road-map-line",
      },
    ],
    [selectedVisualization]
  );

  useEffect(() => {
    const applyAnchor = () => {
      const anchor = window.location.hash.replace("#", "");
      if (anchor === "carte" || anchor === "tableau") {
        setSelectedVisualization(anchor as Visualization);
      }
    };

    applyAnchor();
    window.addEventListener("hashchange", applyAnchor);
    return () => window.removeEventListener("hashchange", applyAnchor);
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-alt-grey">
      <div className="flex gap-2 px-6 border-b border-b-border-default-grey min-h-[4.35rem] justify-between items-center sticky top-0 bg-lifted-grey z-10">
        <SegmentedControl
          key={selectedVisualization}
          name="Visualisation"
          options={options}
          onChange={(event) => {
            setVisualization(event as Visualization);
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

      {selectedVisualization === "tableau" && (
        <>
          <Toolbar variant="tableau" totalStructures={totalStructures} />
          <div id="tableau">
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
          </div>
        </>
      )}

      {selectedVisualization === "carte" && (
        <div id="carte" className="relative flex-1 min-h-0">
          <div className="absolute inset-0">
            <StructuresMap />
          </div>
          <div className="relative z-10">
            <Toolbar variant="carte" totalStructures={totalStructures} />
          </div>
        </div>
      )}
    </div>
  );
}
