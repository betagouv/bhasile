import { Prisma } from "@/generated/prisma/client";
import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";

import { StructureVersionDbDetails } from "../structure-versions/structure-version.db.type";

export const STRUCTURES_ORDER_CTE_SQL = Prisma.sql`
  WITH dernier_millesime_structure_typologie AS (
    SELECT DISTINCT ON (st."structureId")
      st."structureId",
      st."placesAutorisees"
    FROM public."StructureTypologie" st
    ORDER BY st."structureId", st."year" DESC
  ),
  structure_repartition AS (
    SELECT
      a."structureId",
      CASE
        WHEN BOOL_AND(a.repartition = 'COLLECTIF'::public."Repartition") THEN 'COLLECTIF'
        WHEN BOOL_AND(a.repartition = 'DIFFUS'::public."Repartition") THEN 'DIFFUS'
        ELSE 'MIXTE'
      END AS bati
    FROM public."Adresse" a
    WHERE a.repartition IS NOT NULL
    GROUP BY a."structureId"
  )
`;

export const STRUCTURES_ORDER_JOINS_SQL = Prisma.sql`
  FROM public."Structure" s
  LEFT JOIN public."Operateur" o ON o.id = s."operateurId"
  LEFT JOIN dernier_millesime_structure_typologie st ON st."structureId" = s.id
  LEFT JOIN structure_repartition sr ON sr."structureId" = s.id
`;

export const VERSIONED_FIELD_KEYS = [
  "type",
  "public",
  "adresseAdministrative",
  "codePostalAdministratif",
  "communeAdministrative",
  "departementAdministratif",
  "latitude",
  "longitude",
  "nom",
  "creationDate",
  "date303",
  "lgbt",
  "fvvTeh",
  "notes",
  "nomOfii",
  "directionTerritoriale",
  "contacts",
  "adresses",
  "antennes",
  "structureFinesses",
  "dnaStructures",
  "structureTypologies",
] as const satisfies readonly (keyof StructureAgentUpdateApiType &
  keyof StructureVersionDbDetails)[];
