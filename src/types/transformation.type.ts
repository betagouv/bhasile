export const TransformationType = {
  OUVERTURE_EX_NIHILO: "OUVERTURE_EX_NIHILO",
  OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES:
    "OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES",
  EXTENSION_EX_NIHILO: "EXTENSION_EX_NIHILO",
  EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT:
    "EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT",
  EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT:
    "EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT",
  CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE:
    "CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE",
  CONTRACTION_SANS_TRANSFERT_DE_PLACES: "CONTRACTION_SANS_TRANSFERT_DE_PLACES",
  FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES:
    "FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES",
  FERMETURE_SANS_TRANSFERT: "FERMETURE_SANS_TRANSFERT",
  TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT:
    "TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT",
  TRANSFO_HUDA_FERMETURE_VERS_CADA_NOUVEAU:
    "TRANSFO_HUDA_FERMETURE_VERS_CADA_NOUVEAU",
  TRANSFO_HUDA_FERMETURE_REMISE_EN_CONCURRENCE:
    "TRANSFO_HUDA_FERMETURE_REMISE_EN_CONCURRENCE",
  TRANSFO_HUDA_CONTRACTION_VERS_CADA_EXISTANT:
    "TRANSFO_HUDA_CONTRACTION_VERS_CADA_EXISTANT",
  TRANSFO_HUDA_CONTRACTION_VERS_CADA_NOUVEAU:
    "TRANSFO_HUDA_CONTRACTION_VERS_CADA_NOUVEAU",
  TRANSFO_HUDA_CONTRACTION_REMISE_EN_CONCURRENCE:
    "TRANSFO_HUDA_CONTRACTION_REMISE_EN_CONCURRENCE",
} as const;
export type TransformationType =
  (typeof TransformationType)[keyof typeof TransformationType];

/* Les deux axes d'un parcours HUDA vers CADA : ce qu'il advient des HUDA au départ,
 * et où partent leurs places. */
export type HudaCadaDepartureType =
  | typeof StructureVersionTransformationType.FERMETURE
  | typeof StructureVersionTransformationType.CONTRACTION;

export const HudaCadaDestination = {
  CADA_EXISTANT: "CADA_EXISTANT",
  CADA_NOUVEAU: "CADA_NOUVEAU",
  REMISE_EN_CONCURRENCE: "REMISE_EN_CONCURRENCE",
} as const;
export type HudaCadaDestination =
  (typeof HudaCadaDestination)[keyof typeof HudaCadaDestination];

export type DepartementBearingStructureVersionTransformation = {
  structureVersion?: {
    departementAdministratif?: string | null;
    structure?: { departementAdministratif?: string | null } | null;
  } | null;
};

export const StructureVersionTransformationType = {
  CREATION: "CREATION",
  FERMETURE: "FERMETURE",
  CONTRACTION: "CONTRACTION",
  EXTENSION: "EXTENSION",
} as const;
export type StructureVersionTransformationType =
  (typeof StructureVersionTransformationType)[keyof typeof StructureVersionTransformationType];

export type UpcomingTransformation = {
  kind: StructureVersionTransformationType;
  date: string;
};

export const TransformationFormType = {
  CREATION: "creation",
  HUDA: "huda",
} as const;
export type TransformationFormType =
  (typeof TransformationFormType)[keyof typeof TransformationFormType];

export const StructureVersionTransformationStep = {
  DESCRIPTION: "description",
  PLACES_ET_HEBERGEMENT: "places-et-hebergement",
  ACTES_ADMINISTRATIFS: "actes-administratifs",
} as const;
export type StructureVersionTransformationStep =
  (typeof StructureVersionTransformationStep)[keyof typeof StructureVersionTransformationStep];
