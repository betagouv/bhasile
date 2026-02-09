export type StructureColumn =
  | "dnaCode"
  | "type"
  | "operateur"
  | "departementAdministratif"
  | "bati"
  | "communes"
  | "placesAutorisees"
  | "finConvention";

export type CpomColumn =
  | "operateur"
  | "granularity"
  | "region"
  | "departements"
  | "dateStart"
  | "dateEnd";

export type ListColumn = {
  label: string;
  column: StructureColumn | CpomColumn;
  orderBy: boolean;
  centered: boolean;
};
