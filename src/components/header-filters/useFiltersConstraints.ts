"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useSearchParamsNavigation } from "@/app/hooks/useSearchParamsNavigation";
import { setFilterParam } from "@/app/utils/search-params.util";
import { parseCommaList } from "@/app/utils/string.util";
import { buildZoneSummary, reduceToSingleZone } from "@/app/utils/zone.util";
import { GlobalFilterKey } from "@/types/filters.type";
import { persistGlobalFilters } from "@/utils/global-filters.util";

export const useFiltersConstraints = ({
  hiddenFilters,
  isSingleZone,
}: Options): FiltersConstraintNotice | null => {
  const searchParams = useSearchParams();
  const navigateWithParams = useSearchParamsNavigation();
  const [notice, setNotice] = useState<FiltersConstraintNotice | null>(null);

  const resetKeys = hiddenFilters.filter((key) => searchParams.has(key));
  const departements = parseCommaList(searchParams.get("departements"));
  const reducedDepartements = isSingleZone
    ? reduceToSingleZone(departements)
    : departements;
  const isZoneReduced = reducedDepartements.length !== departements.length;
  const constraintsKey = `${resetKeys.join(",")}|${isZoneReduced ? reducedDepartements.join(",") : ""}`;

  useEffect(() => {
    if (resetKeys.length === 0 && !isZoneReduced) {
      return;
    }
    navigateWithParams(
      (params) => {
        resetKeys.forEach((key) => setFilterParam(params, key, []));
        if (isZoneReduced) {
          setFilterParam(params, "departements", reducedDepartements);
        }
        persistGlobalFilters(params);
      },
      { scroll: false }
    );
    setNotice(
      isZoneReduced
        ? {
            kind: "zone",
            before: buildZoneSummary(departements) ?? "",
            after: buildZoneSummary(reducedDepartements) ?? "",
          }
        : { kind: "hidden", resetKeys }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constraintsKey]);

  return notice;
};

type Options = {
  hiddenFilters: GlobalFilterKey[];
  isSingleZone: boolean;
};

export type FiltersConstraintNotice =
  | { kind: "zone"; before: string; after: string }
  | { kind: "hidden"; resetKeys: GlobalFilterKey[] };
