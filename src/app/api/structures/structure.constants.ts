import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";

import { StructureVersionDbDetails } from "../structure-versions/structure-version.db.type";

export const VERSIONED_FIELD_KEYS = [
  "public",
  "adresseAdministrative",
  "codePostalAdministratif",
  "communeAdministrative",
  "departementAdministratif",
  "latitude",
  "longitude",
  "nom",
  "notes",
  "nomOfii",
  "directionTerritoriale",
  "contacts",
  "adresses",
  "antennes",
  "structureFinesses",
  "dnaStructures",
] as const satisfies readonly (keyof StructureAgentUpdateApiType &
  keyof StructureVersionDbDetails)[];

// Scalaires migrés de Structure vers StructureVersion : réinjectés depuis la version courante à la lecture.
export type VersionedScalarKey =
  | "nom"
  | "adresseAdministrative"
  | "codePostalAdministratif"
  | "communeAdministrative"
  | "latitude"
  | "longitude"
  | "notes"
  | "nomOfii"
  | "directionTerritoriale"
  | "public";
