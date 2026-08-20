import { ListColumn } from "@/types/ListColumn";

export const COLUMNS: ListColumn[] = [
  {
    label: "Opérateur",
    column: "operateur",
    orderBy: true,
  },
  {
    label: "Échelle",
    column: "granularity",
    orderBy: true,
  },
  {
    label: "Région",
    column: "region",
    orderBy: true,
  },
  {
    label: "Départements",
    column: "departements",
    orderBy: false,
  },
  {
    label: "Date début",
    column: "dateStart",
    orderBy: true,
  },
  {
    label: "Date fin",
    column: "dateEnd",
    orderBy: true,
  },
  {
    label: "Structures",
    column: "structures",
    orderBy: true,
  },
];

export const CPOMS_COLUMN_COUNT = COLUMNS.length + 1;
