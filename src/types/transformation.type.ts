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
  TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR:
    "TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR",
  TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR:
    "TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR",
  TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES:
    "TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES",
} as const;
export type TransformationType =
  (typeof TransformationType)[keyof typeof TransformationType];

export const StructureVersionTransformationType = {
  CREATION: "CREATION",
  FERMETURE: "FERMETURE",
  CONTRACTION: "CONTRACTION",
  EXTENSION: "EXTENSION",
} as const;
export type StructureVersionTransformationType =
  (typeof StructureVersionTransformationType)[keyof typeof StructureVersionTransformationType];

export const TransformationSource = {
  AGENT: "AGENT",
  DEMARCHES_NUMERIQUES: "DEMARCHES_NUMERIQUES",
} as const;
export type TransformationSource =
  (typeof TransformationSource)[keyof typeof TransformationSource];

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
