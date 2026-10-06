import {
  CPOM_COLUMNS,
  CpomColumn,
  STRUCTURE_COLUMNS,
  StructureColumn,
} from "@/types/ListColumn";

export type SearchParams = { [key: string]: string | string[] | undefined };

export const getFirstParam = (
  value: string | string[] | undefined
): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export const getPageParam = (searchParams: SearchParams, key: string): number =>
  Number(getFirstParam(searchParams[key])) || 0;

export const deletePaginationParams = (params: URLSearchParams): void => {
  for (const key of Array.from(params.keys())) {
    if (key === "page" || key.endsWith("Page")) {
      params.delete(key);
    }
  }
};

export const setFilterParam = (
  params: URLSearchParams,
  key: string,
  values: (string | number)[]
): void => {
  if (values.length > 0) {
    params.set(key, values.join(","));
  } else {
    params.delete(key);
  }
  deletePaginationParams(params);
};

export const parseStructureColumn = (
  value: string | null
): StructureColumn | null =>
  STRUCTURE_COLUMNS.find((column) => column === value) ?? null;

export const parseCpomColumn = (value: string | null): CpomColumn | null =>
  CPOM_COLUMNS.find((column) => column === value) ?? null;

export const parseSortDirection = (
  value: string | null
): "asc" | "desc" | null => {
  if (value === "asc" || value === "desc") {
    return value;
  }
  return null;
};
