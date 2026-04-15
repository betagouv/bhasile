export type StructureColumn =
  | "codeBhasile"
  | "type"
  | "operateur"
  | "departementAdministratif"
  | "bati"
  | "communes"
  | "placesAutorisees"
  | "finConvention";

export type CpomColumn =
  | "operateur"
  | "structures"
  | "granularity"
  | "region"
  | "departements"
  | "dateStart"
  | "dateEnd";

export type ListColumn = {
  label: string;
  column: StructureColumn | CpomColumn;
  orderBy: boolean;
};
