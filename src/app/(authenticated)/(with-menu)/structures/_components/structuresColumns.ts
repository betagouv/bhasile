import { ListColumn } from "@/types/ListColumn";

export const SHARED_COLUMNS: ListColumn[] = [
  {
    label: "Code",
    column: "codeBhasile",
    orderBy: true,
  },
  {
    label: "Type",
    column: "type",
    orderBy: true,
  },
  {
    label: "Opérateur",
    column: "operateur",
    orderBy: true,
  },
  {
    label: "Dépt.",
    column: "departementAdministratif",
    orderBy: true,
  },
  {
    label: "Communes",
    column: "communes",
    orderBy: false,
  },
  {
    label: "Bâti",
    column: "bati",
    orderBy: true,
  },
];

export const ACTIVE_TRAILING_COLUMNS: ListColumn[] = [
  {
    label: "Places aut.",
    column: "placesAutorisees",
    orderBy: true,
  },
  {
    label: "Fin convention",
    column: "finConvention",
    orderBy: true,
  },
];

export const CLOSED_TRAILING_COLUMNS: ListColumn[] = [
  {
    label: "Archivé le",
    column: "effectiveDate",
    orderBy: false,
  },
  {
    label: "Motif",
    column: "motif",
    orderBy: false,
  },
];

export const STRUCTURES_COLUMN_COUNT =
  SHARED_COLUMNS.length + ACTIVE_TRAILING_COLUMNS.length + 1;
