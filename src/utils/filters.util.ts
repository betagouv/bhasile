import {
  getFirstParam,
  SearchParams,
  setFilterParam,
} from "@/app/utils/search-params.util";
import { parseCommaList } from "@/app/utils/string.util";
import { FILTERS_COOKIE } from "@/constants";
import {
  FILTER_KEYS,
  FilterKey,
  Filters,
} from "@/types/filters.type";

const parseOperateurIds = (value: string | null | undefined): string[] =>
  parseCommaList(value).filter((operateurId) => /^\d+$/.test(operateurId));

export const isFilterKey = (key: string): key is FilterKey =>
  (FILTER_KEYS as readonly string[]).includes(key);

export const getFiltersFromSearchParams = (params: SearchParams): Filters => ({
  departements: getFirstParam(params.departements),
  operateurs: getFirstParam(params.operateurs),
  types: getFirstParam(params.types),
});

export const toFiltersSearchParams = (
  filters: Filters
): URLSearchParams => {
  const params = new URLSearchParams();
  FILTER_KEYS.forEach((key) => {
    const value = filters[key];
    if (value) {
      params.set(key, value);
    }
  });
  return params;
};

export const pickFilters = (
  params: URLSearchParams | null
): URLSearchParams => {
  const filters = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const rawValue = params?.get(key);
    const value =
      key === "operateurs" ? parseOperateurIds(rawValue).join(",") : rawValue;
    if (value) {
      filters.set(key, value);
    }
  }
  return filters;
};

export const omitFilters = (params: URLSearchParams): URLSearchParams => {
  const remaining = new URLSearchParams(params);
  FILTER_KEYS.forEach((key) => remaining.delete(key));
  return remaining;
};

export const persistFilter = (
  key: FilterKey,
  values: (string | number)[]
): void => {
  const storedValue = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${FILTERS_COOKIE}=`))
    ?.slice(FILTERS_COOKIE.length + 1);
  const filters = pickFilters(
    new URLSearchParams(decodeURIComponent(storedValue ?? ""))
  );
  setFilterParam(filters, key, values);
  const value = encodeURIComponent(filters.toString());
  document.cookie = `${FILTERS_COOKIE}=${value}; path=/; samesite=lax`;
};

export const clearStoredFilters = (): void => {
  document.cookie = `${FILTERS_COOKIE}=; path=/; max-age=0`;
};

export const parseFilters = ({
  departements,
  operateurs,
  types,
}: Partial<Filters>): ParsedFilters => ({
  departementList: parseCommaList(departements),
  operateurList: parseOperateurIds(operateurs),
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

export const matchesFilters = (
  { departements, operateurIds, types }: FiltersTarget,
  { departementList, operateurList, typeList }: ParsedFilters
): boolean =>
  matchesSomeValue(departementList, departements) &&
  matchesSomeValue(operateurList, operateurIds) &&
  matchesSomeValue(typeList, types);

export const matchesStructureFilters = (
  { departement, operateurId, type }: StructureFiltersTarget,
  filters: ParsedFilters
): boolean =>
  matchesFilters(
    {
      departements: [departement],
      operateurIds: [operateurId],
      types: [type],
    },
    filters
  );

export type ParsedFilters = {
  departementList: string[];
  operateurList: string[];
  typeList: string[];
};

type FiltersTarget = {
  departements?: (string | null | undefined)[];
  operateurIds?: (number | null | undefined)[];
  types?: (string | null | undefined)[];
};

type StructureFiltersTarget = {
  departement: string | null;
  operateurId: number | null | undefined;
  type: string | null;
};
