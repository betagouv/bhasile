import { getFirstParam, SearchParams } from "@/app/utils/search-params.util";
import { parseCommaList } from "@/app/utils/string.util";
import { GLOBAL_FILTERS_COOKIE } from "@/constants";
import {
  Filters,
  GLOBAL_FILTER_KEYS,
  GlobalFilterKey,
} from "@/types/filters.type";

export const isGlobalFilterKey = (key: string): key is GlobalFilterKey =>
  (GLOBAL_FILTER_KEYS as readonly string[]).includes(key);

export const getGlobalFilters = (params: SearchParams): Filters => ({
  departements: getFirstParam(params.departements),
  operateurs: getFirstParam(params.operateurs),
  types: getFirstParam(params.types),
});

export const toGlobalFiltersSearchParams = (
  filters: Filters
): URLSearchParams => {
  const params = new URLSearchParams();
  GLOBAL_FILTER_KEYS.forEach((key) => {
    const value = filters[key];
    if (value) {
      params.set(key, value);
    }
  });
  return params;
};

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

export const omitGlobalFilters = (params: URLSearchParams): URLSearchParams => {
  const remaining = new URLSearchParams(params);
  GLOBAL_FILTER_KEYS.forEach((key) => remaining.delete(key));
  return remaining;
};

export const persistGlobalFilter = (
  key: GlobalFilterKey,
  values: (string | number)[]
): void => {
  const storedValue = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${GLOBAL_FILTERS_COOKIE}=`))
    ?.slice(GLOBAL_FILTERS_COOKIE.length + 1);
  const filters = pickGlobalFilters(
    new URLSearchParams(decodeURIComponent(storedValue ?? ""))
  );
  if (values.length > 0) {
    filters.set(key, values.join(","));
  } else {
    filters.delete(key);
  }
  const value = encodeURIComponent(filters.toString());
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
