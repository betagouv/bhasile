import { z } from "zod";

import { Repartition } from "@/types/adresse.type";
import { PublicType, StructureType } from "@/types/structure.type";
import { HistoryEvent } from "@/types/structure-history.type";
import { UpcomingTransformation } from "@/types/transformation.type";

import { acteAdministratifApiSchema } from "./acteAdministratif.schema";
import { activiteApiSchema } from "./activite.schema";
import { adresseApiSchema } from "./adresse.schema";
import { antenneApiSchema } from "./antenne.schema";
import { budgetApiSchema } from "./budget.schema";
import { contactApiSchema } from "./contact.schema";
import { controleApiSchema } from "./controle.schema";
import { cpomStructureApiSchema } from "./cpom.schema";
import { CpomStructureApiRead } from "./cpom.schema";
import { dnaStructureApiSchema } from "./dna-structure.schema";
import { documentFinancierApiSchema } from "./documentFinancier.schema";
import { evaluationApiSchema } from "./evaluation.schema";
import { evenementIndesirableGraveApiSchema } from "./evenement-indesirable-grave.schema";
import {
  structureFinessApiPartialSchema,
  structureFinessApiSchema,
} from "./finess.schema";
import { formApiSchema } from "./form.schema";
import { indicateurFinancierApiSchema } from "./indicateurFinancier.schema";
import { operateurSuggestionApiSchema } from "./operateur.schema";
import { structureMillesimeApiSchema } from "./structure-millesime.schema";
import { structureTypologieApiSchema } from "./structure-typologie.schema";

const structureMinimalApiSchema = z.object({
  id: z.number(),
  codeBhasile: z.string().optional(),
  operateur: operateurSuggestionApiSchema,
  type: z.enum(StructureType),
  nom: z.string().optional(),
  structureMillesimes: z.array(structureMillesimeApiSchema).optional(),
  cpomStructures: z.array(cpomStructureApiSchema).optional(),
  nomOfii: z.string().optional(),
  directionTerritoriale: z.string().optional(),
  activeInOfiiFileSince: z.iso.datetime().nullish(),
  inactiveInOfiiFileSince: z.iso.datetime().nullish(),
  departementAdministratif: z
    .string()
    .min(1, "Le département de l'adresse administrative est requis"),
  communeAdministrative: z.string().optional(),
});

export const structureOperateurUpdateApiSchema =
  structureMinimalApiSchema.extend({
    filiale: z.string().optional(),
    adresseAdministrative: z
      .string()
      .min(1, "L'adresse administrative est requise"),
    codePostalAdministratif: z
      .string()
      .min(1, "Le code postal administratif est requis"),
    communeAdministrative: z
      .string()
      .min(1, "La commune de l'adresse administrative est requise"),
    departementAdministratif: z
      .string()
      .min(1, "Le département de l'adresse administrative est requis"),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    creationDate: z.iso.datetime({
      error: "La date de création est requise",
    }),
    date303: z.iso.datetime().nullish(),
    finessCode: z.string().optional(),
    public: z.enum(PublicType),
    adresses: z.array(adresseApiSchema),
    antennes: z.array(antenneApiSchema).optional(),
    dnaStructures: z.array(dnaStructureApiSchema).optional(),
    structureFinesses: z.array(structureFinessApiSchema).optional(),
    structureTypologies: z.array(structureTypologieApiSchema),
    forms: z.array(formApiSchema).optional(),
    contacts: z.array(contactApiSchema),
    documentsFinanciers: z.array(documentFinancierApiSchema),
  });

const partialStructureOperateurUpdateApiSchema =
  structureOperateurUpdateApiSchema.partial().extend({
    id: z.number(),
    codeBhasile: z.string().optional(),
    adresses: z.array(adresseApiSchema.partial()).optional(),
    dnaStructures: z.array(dnaStructureApiSchema.partial()).optional(),
    structureFinesses: z.array(structureFinessApiPartialSchema).optional(),
    forms: z.array(formApiSchema.partial()).optional(),
    contacts: z.array(contactApiSchema.partial()).optional(),
    documentsFinanciers: z.array(documentFinancierApiSchema).optional(),
    structureTypologies: z
      .array(structureTypologieApiSchema.partial().required({ year: true }))
      .optional(),
    structureMillesimes: z.array(structureMillesimeApiSchema).optional(),
  });

const remainingStructureAgentUpdateApiSchema = z.object({
  noEvaluationStructure: z.boolean().optional(),
  notes: z.string().nullish(),
  controles: z.array(controleApiSchema).optional(),
  evaluations: z.array(evaluationApiSchema).optional(),
  evenementsIndesirablesGraves: z
    .array(evenementIndesirableGraveApiSchema)
    .optional(),
  activites: z.array(activiteApiSchema).optional(),
  budgets: z.array(budgetApiSchema).optional(),
  indicateursFinanciers: z.array(indicateurFinancierApiSchema).optional(),
  forms: z.array(formApiSchema).optional(),
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),
});

export const structureAgentUpdateApiSchema =
  partialStructureOperateurUpdateApiSchema.and(
    remainingStructureAgentUpdateApiSchema
  );

export const structureApiSchema = structureOperateurUpdateApiSchema.and(
  remainingStructureAgentUpdateApiSchema.extend({
    id: z.number(),
  })
);

export type StructureMinimalApiType = z.infer<typeof structureMinimalApiSchema>;

export type StructureAgentUpdateApiType = z.infer<
  typeof structureAgentUpdateApiSchema
>;

export type StructureAgentUpdateApiClient = z.input<
  typeof structureAgentUpdateApiSchema
>;

export type StructureApiWrite = z.infer<typeof structureApiSchema>;

export type StructureApiWriteClient = z.input<typeof structureApiSchema>;

export type StructureCampaignApiRead = {
  slug: string;
  isValidated: boolean;
};

export type StructureApiRead = Omit<StructureApiWrite, "cpomStructures"> & {
  fermetureDate: string | null;
  debutConvention: string | null;
  finConvention: string | null;
  debutPeriodeAutorisation: string | null;
  finPeriodeAutorisation: string | null;
  cpomStructures?: CpomStructureApiRead[];
  history?: HistoryEvent[];
  upcomingTransformations?: UpcomingTransformation[];
  operateurLabel: string;
  isAutorisee: boolean;
  isSubventionnee: boolean;
  currentPlaces: {
    placesAutorisees: number;
    qpv: number;
    logementsSociaux: number;
  };
  isInCpom: boolean;
  isInCpomPerYear: Record<number, boolean>;
  isFinalised: boolean;
  campaigns: StructureCampaignApiRead[];
  nom: string;
  adresseAdministrativeComplete: string;
  isMultiAntenne: boolean;
  isMultiDna: boolean;
  typeBati?: Repartition;
  lgbt: boolean;
  fvvTeh: boolean;
};
