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

export type ListColumn = {
  label: string;
  column: StructureColumn | CpomColumn;
  orderBy: boolean;
};
