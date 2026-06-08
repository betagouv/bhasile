import {
  AdditionalFieldsType,
  CategoryDisplayRule,
  CategoryDisplayRules,
} from "@/config/acte-administratif.config";
import { StructureTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";
import {
  StructureTransformationStep,
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

export type StructureSelectionBlock = {
  id: string;
  multiple: boolean;
  type: StructureTransformationType;
  fixedType?: StructureType;
  inheritOperateurFrom?: string;
  inheritDepartementFrom?: string;
  label?: string;
};

export type PrefillField = "contacts" | "antennes" | "adresses";

export type PrefillRule = {
  from: StructureTransformationType;
  to: StructureTransformationType;
  fields: PrefillField[];
};

export type TransformationTypeSpec = {
  title: string;
  blocks: StructureSelectionBlock[];
  buildAutoTransformations: (
    structureId?: number
  ) => StructureTransformationApiCreate[];
  primaryStructureTransformationType?: StructureTransformationType;
  prefill?: PrefillRule[];
};

export const STRUCTURE_TRANSFORMATION_TYPE_ORDER: Record<
  StructureTransformationType,
  number
> = {
  [StructureTransformationType.FERMETURE]: 0,
  [StructureTransformationType.CONTRACTION]: 1,
  [StructureTransformationType.EXTENSION]: 2,
  [StructureTransformationType.CREATION]: 3,
};

export const VERIFICATION_STEP_NAME = "verification";

export const TRANSFORMATION_TYPE_SPECS: Record<
  TransformationType,
  TransformationTypeSpec
> = {
  [TransformationType.OUVERTURE_EX_NIHILO]: {
    title: "Nouvelle structure",
    blocks: [],
    buildAutoTransformations: () => [
      { type: StructureTransformationType.CREATION },
    ],
  },
  [TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES]: {
    title: "Nouvelle structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        label: "Veuillez sélectionner la ou les structures qui ferment",
      },
    ],
    buildAutoTransformations: () => [
      { type: StructureTransformationType.CREATION },
    ],
    prefill: [
      {
        from: StructureTransformationType.FERMETURE,
        to: StructureTransformationType.CREATION,
        fields: ["contacts", "antennes", "adresses"],
      },
    ],
  },
  [TransformationType.EXTENSION_EX_NIHILO]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.EXTENSION,
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.CONTRACTION,
        label:
          "Veuillez sélectionner la ou les structures dont sont issues les places",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.EXTENSION,
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        label:
          "Veuillez sélectionner la ou les structures dont sont issues les places",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.EXTENSION,
  },
  [TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.EXTENSION,
        label:
          "Veuillez sélectionner la ou les structures vers lesquelles les places sont transférées",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.CONTRACTION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.CONTRACTION,
  },
  [TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.CONTRACTION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.CONTRACTION,
  },
  [TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES]:
    {
      title: "Transformer une structure",
      blocks: [
        {
          id: "main",
          multiple: true,
          type: StructureTransformationType.EXTENSION,
          label:
            "Veuillez sélectionner la ou les structures vers lesquelles les places sont transférées",
        },
      ],
      buildAutoTransformations: (structureId) => [
        {
          type: StructureTransformationType.FERMETURE,
          structureVersion: { structureId },
        },
      ],
      primaryStructureTransformationType: StructureTransformationType.FERMETURE,
    },
  [TransformationType.FERMETURE_SANS_TRANSFERT]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.FERMETURE,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.FERMETURE,
  },
  [TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
      {
        id: "cada",
        multiple: false,
        type: StructureTransformationType.EXTENSION,
        fixedType: StructureType.CADA,
        inheritOperateurFrom: "huda",
        inheritDepartementFrom: "huda",
        label: "Veuillez sélectionner le CADA qui fait l'objet d'une extension",
      },
    ],
    buildAutoTransformations: () => [],
  },
  [TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
    ],
    buildAutoTransformations: () => [
      {
        type: StructureTransformationType.CREATION,
        structureVersion: { type: StructureType.CADA },
      },
    ],
  },
  [TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
    ],
    buildAutoTransformations: () => [],
  },
};

const CONVENTION_RULE: CategoryDisplayRule = {
  categoryShortName: "convention",
  title: "Convention",
  canAddFile: false,
  canAddAvenant: false,
  isOptional: false,
  shouldShow: true,
  additionalFieldsType: AdditionalFieldsType.DATE_START_END,
  documentLabel: "Document",
  addFileButtonLabel: "Ajouter une convention",
};

const AUTRE_RULE: CategoryDisplayRule = {
  categoryShortName: "autre",
  title: "Autres documents",
  canAddFile: true,
  canAddAvenant: false,
  isOptional: true,
  shouldShow: true,
  additionalFieldsType: AdditionalFieldsType.NAME,
  documentLabel: "Document",
  addFileButtonLabel: "Ajouter un document",
};

const getCreationActesAdministratifsCategoryToDisplay = (
  transformationType: TransformationType | undefined
): CategoryDisplayRules => ({
  ARRETE_AUTORISATION: {
    categoryShortName: "arrêté",
    title:
      transformationType === TransformationType.OUVERTURE_EX_NIHILO
        ? "Arrêté d'autorisation"
        : "Arrêté d'autorisation ou arrêté de fusion des structures",
    canAddFile: false,
    canAddAvenant: false,
    isOptional: false,
    shouldShow: true,
    additionalFieldsType: AdditionalFieldsType.DATE_START_END,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter un arrêté d'autorisation",
    alternativeCategories:
      transformationType === TransformationType.OUVERTURE_EX_NIHILO
        ? undefined
        : ["ARRETE_FUSION"],
  },
  CONVENTION: CONVENTION_RULE,
  ARRETE_TARIFICATION: {
    categoryShortName: "arrêté",
    title: "Arrêté de tarification",
    canAddFile: false,
    canAddAvenant: false,
    isOptional: false,
    shouldShow: true,
    additionalFieldsType: AdditionalFieldsType.DATE_START_END,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter un arrêté de tarification",
  },
  AUTRE: {
    ...AUTRE_RULE,
    notice: `Dans cette catégorie, vous avez la possibilité d'importer d'autres documents utiles à l'analyse de la structure (ex: Plans Pluriannuels d'Investissements)`,
  },
});

export const fermetureActesAdministratifsCategoryToDisplay: CategoryDisplayRules =
  {
    AUTRE: {
      categoryShortName: "autre",
      title: "Arrêtés ou documents actant la fermeture",
      canAddFile: true,
      canAddAvenant: false,
      isOptional: true,
      shouldShow: true,
      additionalFieldsType: AdditionalFieldsType.NAME,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un document",
    },
  };

const extensionActesAdministratifsCategoryToDisplay: CategoryDisplayRules = {
  CONVENTION: CONVENTION_RULE,
  ARRETE_EXTENSION: {
    categoryShortName: "arrêté",
    title: "Arrêté d'extension",
    canAddFile: false,
    canAddAvenant: false,
    isOptional: false,
    shouldShow: true,
    additionalFieldsType: AdditionalFieldsType.DATE,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter un arrêté d'extension",
    notice:
      "Pour rappel, les dates de l'arrêté d'autorisation n'ont pas vocation à changer pour cette transformation.",
  },
  AUTRE: {
    ...AUTRE_RULE,
    notice:
      "Pour rappel, dans le cadre d'une extension de grande ampleur, il est obligatoire de mener une visite de conformité au plus tard 3 semaines avant l'ouverture, et son procès-verbal doit être transmis au maximum 15 jours après la visite.",
  },
};

const contractionActesAdministratifsCategoryToDisplay: CategoryDisplayRules = {
  CONVENTION: CONVENTION_RULE,
  ARRETE_CONTRACTION: {
    categoryShortName: "arrêté",
    title: "Arrêté actant la contraction",
    canAddFile: false,
    canAddAvenant: false,
    isOptional: false,
    shouldShow: true,
    additionalFieldsType: AdditionalFieldsType.DATE,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter un arrêté",
  },
  AUTRE: {
    ...AUTRE_RULE,
    notice:
      "Dans cette catégorie, vous avez la possibilité d'importer d'autres documents utiles à l'analyse de la structure (ex: arrêté modificatif au budget, arrêté de tarification provisoire...).",
  },
};

export const getTransformationActesAdministratifsCategoryToDisplay = (
  structureTransformationType: StructureTransformationType,
  transformationType: TransformationType | undefined
): CategoryDisplayRules => {
  switch (structureTransformationType) {
    case StructureTransformationType.EXTENSION:
      return extensionActesAdministratifsCategoryToDisplay;
    case StructureTransformationType.CONTRACTION:
      return contractionActesAdministratifsCategoryToDisplay;
    case StructureTransformationType.FERMETURE:
      return fermetureActesAdministratifsCategoryToDisplay;
    case StructureTransformationType.CREATION:
      return getCreationActesAdministratifsCategoryToDisplay(transformationType);
  }
};

export const STRUCTURE_TRANSFORMATION_FORM_NAME: Record<
  StructureTransformationType,
  string
> = {
  [StructureTransformationType.CREATION]: "structure-transformation-creation",
  [StructureTransformationType.EXTENSION]: "structure-transformation-extension",
  [StructureTransformationType.CONTRACTION]:
    "structure-transformation-contraction",
  [StructureTransformationType.FERMETURE]: "structure-transformation-fermeture",
};

export type StructureTransformationFormStepSpec = {
  name: StructureTransformationStep;
  slug: string;
};

const STRUCTURE_TRANSFORMATION_COMPLETE_FORM_STEPS: StructureTransformationFormStepSpec[] =
  [
    {
      name: StructureTransformationStep.DESCRIPTION,
      slug: "01-identification",
    },
    {
      name: StructureTransformationStep.PLACES_ET_HEBERGEMENT,
      slug: "02-places-hebergement",
    },
    {
      name: StructureTransformationStep.ACTES_ADMINISTRATIFS,
      slug: "03-actes-administratifs",
    },
  ];

const STRUCTURE_TRANSFORMATION_FERMETURE_FORM_STEPS: StructureTransformationFormStepSpec[] =
  [
    {
      name: StructureTransformationStep.DESCRIPTION,
      slug: "01-identification",
    },
  ];

export const STRUCTURE_TRANSFORMATION_FORM_STEPS: Record<
  string,
  StructureTransformationFormStepSpec[]
> = {
  [STRUCTURE_TRANSFORMATION_FORM_NAME[StructureTransformationType.CREATION]]:
    STRUCTURE_TRANSFORMATION_COMPLETE_FORM_STEPS,
  [STRUCTURE_TRANSFORMATION_FORM_NAME[StructureTransformationType.EXTENSION]]:
    STRUCTURE_TRANSFORMATION_COMPLETE_FORM_STEPS,
  [STRUCTURE_TRANSFORMATION_FORM_NAME[StructureTransformationType.CONTRACTION]]:
    STRUCTURE_TRANSFORMATION_COMPLETE_FORM_STEPS,
  [STRUCTURE_TRANSFORMATION_FORM_NAME[StructureTransformationType.FERMETURE]]:
    STRUCTURE_TRANSFORMATION_FERMETURE_FORM_STEPS,
};
