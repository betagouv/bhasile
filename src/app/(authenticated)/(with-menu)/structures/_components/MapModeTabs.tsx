"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { useSearchParamsNavigation } from "@/app/hooks/useSearchParamsNavigation";
import { parseMapMode } from "@/app/utils/searchParams.util";
import { MapMode } from "@/types/structure-list.type";

export const MapModeTabs = (): ReactElement => {
  const searchParams = useSearchParams();
  const navigateWithParams = useSearchParamsNavigation();
  const isClosed = searchParams.get("statut") === "fermees";
  const mode = parseMapMode(searchParams.get("mode"), isClosed);

  const handleChange = (next: MapMode) => {
    navigateWithParams((params) =>
      next === "places" ? params.set("mode", next) : params.delete("mode")
    );
  };

  return (
    <SegmentedControl
      small
      legend="Afficher sur la carte"
      hideLegend
      segments={[
        {
          label: "Structures",
          nativeInputProps: {
            value: "structures",
            checked: mode === "structures",
            onChange: () => handleChange("structures"),
          },
        },
        {
          label: isClosed ? (
            <span title={CLOSED_PLACES_HINT}>Places</span>
          ) : (
            "Places"
          ),
          nativeInputProps: {
            value: "places",
            checked: mode === "places",
            disabled: isClosed,
            title: isClosed ? CLOSED_PLACES_HINT : undefined,
            onChange: () => handleChange("places"),
          },
        },
      ]}
    />
  );
};

// Sur l'input désactivé, le title n'est pas affiché par tous les navigateurs : il est porté par le label.
const CLOSED_PLACES_HINT =
  "Les places ne sont localisées que pour les structures actives";
