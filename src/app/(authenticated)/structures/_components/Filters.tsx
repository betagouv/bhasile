import { Button } from "@codegouvfr/react-dsfr/Button";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/app/utils/classname.util";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { FiltersPanel } from "./FiltersPanel";
import { LocationFiltersPanel } from "./LocationFiltersPanel";

export const Filters = () => {
  const [openPanel, setOpenPanel] = useState<
    "filters" | "location" | undefined
  >(undefined);

  const handleTogglePanel = (panel: "filters" | "location" | undefined) => {
    if (openPanel === panel) {
      setOpenPanel(undefined);
    } else {
      setOpenPanel(panel);
    }
  };

  const [isFiltersActive, setIsFiltersActive] = useState(false);
  const [isLocationActive, setIsLocationActive] = useState(false);

  const searchParams = useSearchParams();
  const type: StructureType | null = searchParams.get(
    "type"
  ) as StructureType | null;
  const bati: Repartition | null = searchParams.get(
    "bati"
  ) as Repartition | null;
  const places: string | null = searchParams.get("places");

  useEffect(() => {
    if (type || bati || places) {
      setIsFiltersActive(true);
    } else {
      setIsFiltersActive(false);
    }
  }, [type, bati, places]);

  const departements: string | null = searchParams.get("departements");

  useEffect(() => {
    if (departements) {
      setIsLocationActive(true);
    } else {
      setIsLocationActive(false);
    }
  }, [departements]);

  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const locationPanelRef = useRef<HTMLDivElement | null>(null);
  const locationButtonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!openPanel) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      let clickedInsidePanel = false;

      if (
        (filterPanelRef.current &&
          filterPanelRef.current.contains(event.target as Node)) ||
        (locationPanelRef.current &&
          locationPanelRef.current.contains(event.target as Node)) ||
        (filterButtonRef.current &&
          filterButtonRef.current.contains(event.target as Node)) ||
        (locationButtonRef.current &&
          locationButtonRef.current.contains(event.target as Node))
      ) {
        clickedInsidePanel = true;
      }

      if (!clickedInsidePanel) {
        setOpenPanel(undefined);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openPanel]);

  return (
    <>
      <div className="relative">
        <Button
          ref={filterButtonRef}
          priority="tertiary"
          size="small"
          onClick={() => handleTogglePanel("filters")}
          className={cn(
            "flex gap-1",
            isFiltersActive && "bg-[var(--blue-france-975-sun-113)]"
          )}
          aria-label={`Filtres ${isFiltersActive ? "actifs" : "inactifs"}`}
          aria-pressed={isFiltersActive}
        >
          <span className="fr-icon-filter-line fr-icon--sm relative">
            {isFiltersActive && (
              <span className="absolute block rounded-full w-1.5 h-1.5 bg-border-action-high-warning top-0 right-0" />
            )}
          </span>{" "}
          Filtres
        </Button>
        {openPanel === "filters" && (
          <FiltersPanel
            ref={filterPanelRef}
            closePanel={() => handleTogglePanel(undefined)}
            isActive={isFiltersActive}
          />
        )}
      </div>
      <div className="relative">
        <Button
          ref={locationButtonRef}
          priority="tertiary"
          size="small"
          onClick={() => handleTogglePanel("location")}
          className={cn(
            "flex gap-1 whitespace-nowrap",
            isLocationActive && "bg-[var(--blue-france-975-sun-113)]"
          )}
          aria-label={`Filtres par région / département ${isLocationActive ? "actifs" : "inactifs"}`}
          aria-pressed={isLocationActive}
        >
          <span className="fr-icon-focus-3-line fr-icon--sm relative">
            {isLocationActive && (
              <span className="absolute block rounded-full w-1.5 h-1.5 bg-border-action-high-warning top-0 right-0" />
            )}
          </span>{" "}
          Région / Département
        </Button>
        {openPanel === "location" && (
          <LocationFiltersPanel
            ref={locationPanelRef}
            closePanel={() => handleTogglePanel(undefined)}
            isActive={isLocationActive}
          />
        )}
      </div>
    </>
  );
};
