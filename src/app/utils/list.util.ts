import { DEFAULT_PAGE_SIZE } from "@/constants";

export type SortValue = string | number | null;
export type SortKind = "text" | "number";

export type SortAccessor<TRow> = (row: TRow) => {
  value: SortValue;
  kind: SortKind;
};

export const compareSortValues = (
  first: SortValue,
  second: SortValue,
  direction: "asc" | "desc",
  kind: SortKind
): number => {
  const firstIsNull = first === null;
  const secondIsNull = second === null;
  if (firstIsNull && secondIsNull) {
    return 0;
  }
  if (firstIsNull) {
    return direction === "asc" ? 1 : -1;
  }
  if (secondIsNull) {
    return direction === "asc" ? -1 : 1;
  }
  const comparison =
    kind === "text"
      ? String(first).localeCompare(String(second), "fr")
      : (first as number) - (second as number);
  return direction === "asc" ? comparison : -comparison;
};

export const sortRows = <TRow>(
  rows: TRow[],
  getSortValue: SortAccessor<TRow>,
  getTieBreak: SortAccessor<TRow>,
  direction: "asc" | "desc"
): TRow[] =>
  [...rows].sort((first, second) => {
    const firstValue = getSortValue(first);
    const secondValue = getSortValue(second);
    const primary = compareSortValues(
      firstValue.value,
      secondValue.value,
      direction,
      firstValue.kind
    );
    if (primary !== 0) {
      return primary;
    }
    const firstTieBreak = getTieBreak(first);
    const secondTieBreak = getTieBreak(second);
    return compareSortValues(
      firstTieBreak.value,
      secondTieBreak.value,
      "asc",
      firstTieBreak.kind
    );
  });

export const paginateRows = <T>(
  rows: T[],
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE
): T[] => {
  const safePage = Math.max(0, page);
  return rows.slice(safePage * pageSize, safePage * pageSize + pageSize);
};
