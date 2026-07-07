import { z } from "zod";

import { PublicType } from "@/types/structure.type";

import { adresseApiSchema } from "./adresse.schema";
import { antenneApiSchema } from "./antenne.schema";
import { contactApiSchema } from "./contact.schema";
import { dnaStructureApiSchema } from "./dna-structure.schema";
import { structureFinessApiPartialSchema } from "./finess.schema";
import { structureTypologieApiSchema } from "./structure-typologie.schema";

export const structureVersionApiSchema = z.object({
  id: z.number().optional(),
  structureId: z.number().optional(),
  structureVersionTransformationId: z.number().optional(),

  effectiveDate: z.iso.datetime().nullish(),

  public: z.enum(PublicType).nullish(),
  adresseAdministrative: z.string().nullish(),
  codePostalAdministratif: z.string().nullish(),
  communeAdministrative: z.string().nullish(),
  departementAdministratif: z.string().nullish(),
  latitude: z.string().nullish(),
  longitude: z.string().nullish(),
  nom: z.string().nullish(),
  notes: z.string().nullish(),
  nomOfii: z.string().nullish(),
  directionTerritoriale: z.string().nullish(),

  contacts: z.array(contactApiSchema.partial()).optional(),
  adresses: z.array(adresseApiSchema.partial()).optional(),
  antennes: z.array(antenneApiSchema.partial()).optional(),
  structureFinesses: z.array(structureFinessApiPartialSchema).optional(),
  dnaStructures: z.array(dnaStructureApiSchema.partial()).optional(),
  structureTypologies: z
    .array(structureTypologieApiSchema.partial().required({ year: true }))
    .optional(),
});

export type StructureVersionApiType = z.infer<typeof structureVersionApiSchema>;
