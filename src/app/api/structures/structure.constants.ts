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
