import type { StructureType } from "@/generated/prisma/client";

import type { Repartition } from "./adresse.type";
import type { StructureColumn } from "./ListColumn";

export type StructureCommune = {
  name: string;
  placesAutorisees: number;
};

export type StructureListItem = {
  id: number;
  codeBhasile?: string;
  type?: StructureType;
  operateurLabel: string;
  departementAdministratif?: string;
  bati?: Repartition;
  placesAutorisees?: number;
  finConvention?: string;
  isFinalised: boolean;
  isClosed: boolean;
  fermetureDate?: string;
  fermetureMotif?: string;
  communes: StructureCommune[];
};

export type StructureMapPoint = {
  id: number;
  latitude: string;
  longitude: string;
};

export type Visualization = "tableau" | "carte";

export type MapMode = "structures" | "places";

export type CommuneStructure = {
  id: number;
  nom: string | null;
  codeBhasile: string | null;
  type: StructureType | null;
  operateurLabel: string;
  places: number;
  isFinalised: boolean;
};

export type CommuneMapPoint = {
  key: string;
  latitude: number;
  longitude: number;
  nom: string;
  places: number;
  structures: CommuneStructure[];
};

export type CommunePoints = {
  communes: CommuneMapPoint[];
  totalPlaces: number;
  nonLocalisedPlaces: number;
  nonRepresentedStructuresCount: number;
};

export type SearchProps = {
  search: string | null;
  page: number | null;
  type: string | null;
  bati: string | null;
  placesAutorisees: string | null;
  departements: string | null;
  operateurs: string | null;
  column?: StructureColumn | null;
  direction?: "asc" | "desc" | null;
  selection?: boolean;
  isFinalised?: boolean;
  isClosed?: boolean;
};

export type StructuresQuery = SearchProps & {
  vue: Visualization;
  mode: MapMode;
};
