export const STRUCTURE_COLUMNS = [
  "codeBhasile",
  "type",
  "operateur",
  "departementAdministratif",
  "bati",
  "communes",
  "placesAutorisees",
  "finConvention",
  "effectiveDate",
  "motif",
] as const;

export type StructureColumn = (typeof STRUCTURE_COLUMNS)[number];

export const parseStructureColumn = (
  value: string | null
): StructureColumn | null =>
  STRUCTURE_COLUMNS.find((column) => column === value) ?? null;

export const CPOM_COLUMNS = [
  "operateur",
  "structures",
  "granularity",
  "region",
  "departements",
  "dateStart",
  "dateEnd",
] as const;

export type CpomColumn = (typeof CPOM_COLUMNS)[number];

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

export type ListColumn = {
  label: string;
  column: StructureColumn | CpomColumn;
  orderBy: boolean;
};
