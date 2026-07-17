"use client";

import { sendEvent } from "@socialgouv/matomo-next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";

import { SegmentedControl } from "@/app/components/common/SegmentedControl";
import { ListLoader } from "@/app/components/lists/ListLoader";
import { OngoingTransformationsBanner } from "@/app/components/transformations/OngoingTransformationsBanner";
import { usePersistStructuresSearchQuery } from "@/app/hooks/usePersistStructuresSearchQuery";
import { useStructuresSearch } from "@/app/hooks/useStructuresSearch";

import { StructuresTable } from "./_components/StructuresTable";
import { Toolbar } from "./_components/Toolbar";

type Visualization = "tableau" | "carte";

export default function Structures(): ReactElement {
  const [selectedVisualization, setSelectedVisualization] =
    useState<Visualization>(() => {
      if (typeof window === "undefined") {
        return "tableau";
      }
      const anchor = window.location.hash.replace("#", "");
      return anchor === "carte" ? "carte" : "tableau";
    });

  usePersistStructuresSearchQuery();

  const searchParams = useSearchParams();
  const statut =
    searchParams.get("statut") === "fermees" ? "fermees" : "actives";
  const isClosed = statut === "fermees";

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
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-center px-6 border-b border-b-border-default-grey min-h-[4.35rem] sticky top-0 bg-lifted-grey z-10">
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
        {process.env.NEXT_PUBLIC_SHOW_TRANSFORMATION === "true" && ( //TODO: remove this once transformation is ready
          <div className="flex items-center gap-4">
            <Link
              className="fr-btn fr-btn--secondary flex gap-2"
              href="/structures/transformation/type?type=huda"
            >
              <span className="fr-icon-arrow-left-right-line fr-icon--sm" />
              Transformer HUDA en CADA
            </Link>
            <Link
              className="fr-btn fr-btn--secondary flex gap-2"
              href="/structures/transformation/type?type=creation"
            >
              <span className="fr-icon-add-line fr-icon--sm" />
              Créer une structure
            </Link>
          </div>
        )}
      </div>

      <OngoingTransformationsBanner />

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
                  key={statut}
                  structures={structures}
                  totalStructures={totalStructures}
                  ariaLabelledBy="structures-titre"
                  isClosed={isClosed}
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
