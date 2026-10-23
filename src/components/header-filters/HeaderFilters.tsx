"use client";

import { formatPlural } from "@/app/utils/string.util";
import { buildZoneSummary } from "@/app/utils/zone.util";
import { GlobalFilterKey } from "@/types/filters.type";
import { buildTypesSummary } from "@/utils/structure-type.util";

import { FilterDropdown } from "./FilterDropdown";
import { FilterOperateur } from "./FilterOperateur";
import { FiltersConstraintModal } from "./FiltersConstraintModal";
import { FiltersDepartement } from "./FiltersDepartement";
import { FilterTypeStructure } from "./FilterTypeStructure";
import { GLOBAL_FILTER_LABELS } from "./globalFilterLabels";
import { useFiltersConstraints } from "./useFiltersConstraints";

export const HeaderFilters = ({
  pageTitle,
  hiddenFilters = [],
  isSingleZone = false,
}: Props) => {
  const notice = useFiltersConstraints({ hiddenFilters, isSingleZone });
  const isVisible = (key: GlobalFilterKey) => !hiddenFilters.includes(key);

  return (
    <div className="flex">
      {isVisible("departements") && (
        <FilterDropdown
          label={GLOBAL_FILTER_LABELS.departements}
          placeholder="Toute la France"
          filterId="departements"
          getSummaryLabel={buildZoneSummary}
          renderOptions={({ selection, setSelection }) => (
            <FiltersDepartement
              departements={selection}
              onChange={setSelection}
              isSingleZone={isSingleZone}
            />
          )}
        />
      )}

      {isVisible("operateurs") && (
        <FilterDropdown
          label={GLOBAL_FILTER_LABELS.operateurs}
          placeholder="Tous les opérateurs"
          filterId="operateurs"
          getSummaryLabel={(operateurIds) =>
            formatPlural(operateurIds.length, "opérateur")
          }
          renderOptions={({ selection, toggleValue }) => (
            <FilterOperateur selection={selection} onToggle={toggleValue} />
          )}
        />
      )}

      {isVisible("types") && (
        <FilterDropdown
          label={GLOBAL_FILTER_LABELS.types}
          placeholder="Tous les types"
          filterId="types"
          getSummaryLabel={buildTypesSummary}
          renderOptions={({ selection, setSelection }) => (
            <FilterTypeStructure
              selection={selection}
              onChange={setSelection}
            />
          )}
        />
      )}

      <FiltersConstraintModal notice={notice} pageTitle={pageTitle} />
    </div>
  );
};

type Props = {
  pageTitle: string;
  hiddenFilters?: GlobalFilterKey[];
  isSingleZone?: boolean;
};
