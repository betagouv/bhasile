import { parseCommaList } from "@/app/utils/string.util";
import { GLOBAL_FILTERS_COOKIE } from "@/constants";
import {
  Filters,
  GLOBAL_FILTER_KEYS,
  GlobalFilterKey,
} from "@/types/filters.type";

export const isGlobalFilterKey = (key: string): key is GlobalFilterKey =>
  (GLOBAL_FILTER_KEYS as readonly string[]).includes(key);

export const hasGlobalFilters = (params: URLSearchParams): boolean =>
  GLOBAL_FILTER_KEYS.some((key) => params.has(key));

export const pickGlobalFilters = (
  params: URLSearchParams | null
): URLSearchParams => {
  const filters = new URLSearchParams();
  for (const key of GLOBAL_FILTER_KEYS) {
    const value = params?.get(key);
    if (value) {
      filters.set(key, value);
    }
  }
  return filters;
};

export const withGlobalFilters = (
  pathname: string,
  filters: URLSearchParams
): string => {
  const query = filters.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export const persistGlobalFilters = (params: URLSearchParams): void => {
  const value = encodeURIComponent(pickGlobalFilters(params).toString());
  document.cookie = `${GLOBAL_FILTERS_COOKIE}=${value}; path=/; samesite=lax`;
};

export const parseGlobalFilters = ({
  departements,
  operateurs,
  types,
}: Partial<Filters>): ParsedGlobalFilters => ({
  departementList: parseCommaList(departements),
  operateurList: parseCommaList(operateurs),
  typeList: parseCommaList(types),
});

const matchesSomeValue = (
  acceptedValues: string[],
  values: (string | number | null | undefined)[] | undefined
): boolean =>
  acceptedValues.length === 0 ||
  values === undefined ||
  values.some(
    (value) =>
      value !== null &&
      value !== undefined &&
      acceptedValues.includes(String(value))
  );

export const matchesGlobalFilters = (
  { departements, operateurIds, types }: GlobalFiltersTarget,
  { departementList, operateurList, typeList }: ParsedGlobalFilters
): boolean =>
  matchesSomeValue(departementList, departements) &&
  matchesSomeValue(operateurList, operateurIds) &&
  matchesSomeValue(typeList, types);

export type ParsedGlobalFilters = {
  departementList: string[];
  operateurList: string[];
  typeList: string[];
};

type GlobalFiltersTarget = {
  departements?: (string | null | undefined)[];
  operateurIds?: (number | null | undefined)[];
  types?: (string | null | undefined)[];
};
