import {
  AdditionalFieldsType,
  CategoryDisplayRule,
  CategoryDisplayRules,
} from "@/config/acte-administratif.config";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { StructureType } from "@/types/structure.type";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

export type StructureSelectionBlock = {
  id: string;
  multiple: boolean;
  type: StructureVersionTransformationType;
  fixedType?: StructureType;
  matchDepartureType?: boolean;
  matchDepartureDepartement?: boolean;
  inheritOperateurFrom?: string;
  inheritDepartementFrom?: string;
  label?: string;
};

export type PrefillField = "contacts" | "antennes" | "adresses" | "operateur";

export type PrefillRule = {
  from: StructureVersionTransformationType;
  to: StructureVersionTransformationType;
  fields: PrefillField[];
};

export type TransformationTypeSpec = {
  title: string;
  blocks: StructureSelectionBlock[];
  buildAutoTransformations: (
    structureId?: number
  ) => StructureVersionTransformationApiCreate[];
  primaryStructureVersionTransformationType?: StructureVersionTransformationType;
  prefill?: PrefillRule[];
};

export const STRUCTURE_VERSION_TRANSFORMATION_TYPE_ORDER: Record<
  StructureVersionTransformationType,
  number
> = {
  [StructureVersionTransformationType.FERMETURE]: 0,
  [StructureVersionTransformationType.CONTRACTION]: 1,
  [StructureVersionTransformationType.EXTENSION]: 2,
  [StructureVersionTransformationType.CREATION]: 3,
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
      { type: StructureVersionTransformationType.CREATION },
    ],
  },
  [TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES]: {
    title: "Nouvelle structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureVersionTransformationType.FERMETURE,
        label: "Veuillez sélectionner la ou les structures qui ferment",
      },
    ],
    buildAutoTransformations: () => [
      { type: StructureVersionTransformationType.CREATION },
    ],
    prefill: [
      {
        from: StructureVersionTransformationType.FERMETURE,
        to: StructureVersionTransformationType.CREATION,
        fields: ["contacts", "antennes", "adresses", "operateur"],
      },
    ],
  },
  [TransformationType.EXTENSION_EX_NIHILO]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureVersionTransformationType.EXTENSION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureVersionTransformationType:
      StructureVersionTransformationType.EXTENSION,
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureVersionTransformationType.CONTRACTION,
        matchDepartureType: true,
        matchDepartureDepartement: true,
        label:
          "Veuillez sélectionner la ou les structures dont sont issues les places",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureVersionTransformationType.EXTENSION,
        structureVersion: { structureId },
      },
    ],
    prefill: [
      {
        from: StructureVersionTransformationType.CONTRACTION,
        to: StructureVersionTransformationType.EXTENSION,
        fields: ["contacts", "antennes", "adresses"],
      },
    ],
    primaryStructureVersionTransformationType:
      StructureVersionTransformationType.EXTENSION,
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureVersionTransformationType.FERMETURE,
        matchDepartureType: true,
        matchDepartureDepartement: true,
        label:
          "Veuillez sélectionner la ou les structures dont sont issues les places",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureVersionTransformationType.EXTENSION,
        structureVersion: { structureId },
      },
    ],
    prefill: [
      {
        from: StructureVersionTransformationType.FERMETURE,
        to: StructureVersionTransformationType.EXTENSION,
        fields: ["contacts", "antennes", "adresses"],
      },
    ],
    primaryStructureVersionTransformationType:
      StructureVersionTransformationType.EXTENSION,
  },
  [TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureVersionTransformationType.EXTENSION,
        matchDepartureType: true,
        matchDepartureDepartement: true,
        label:
          "Veuillez sélectionner la ou les structures vers lesquelles les places sont transférées",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureVersionTransformationType.CONTRACTION,
        structureVersion: { structureId },
      },
    ],
    prefill: [
      {
        from: StructureVersionTransformationType.CONTRACTION,
        to: StructureVersionTransformationType.EXTENSION,
        fields: ["contacts", "antennes", "adresses"],
      },
    ],
    primaryStructureVersionTransformationType:
      StructureVersionTransformationType.CONTRACTION,
  },
  [TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureVersionTransformationType.CONTRACTION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureVersionTransformationType:
      StructureVersionTransformationType.CONTRACTION,
  },
  [TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES]:
    {
      title: "Transformer une structure",
      blocks: [
        {
          id: "main",
          multiple: true,
          type: StructureVersionTransformationType.EXTENSION,
          matchDepartureType: true,
          matchDepartureDepartement: true,
          label:
            "Veuillez sélectionner la ou les structures vers lesquelles les places sont transférées",
        },
      ],
      buildAutoTransformations: (structureId) => [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId },
        },
      ],
      prefill: [
        {
          from: StructureVersionTransformationType.FERMETURE,
          to: StructureVersionTransformationType.EXTENSION,
          fields: ["contacts", "antennes", "adresses"],
        },
      ],
      primaryStructureVersionTransformationType:
        StructureVersionTransformationType.FERMETURE,
    },
  [TransformationType.FERMETURE_SANS_TRANSFERT]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion: { structureId },
      },
    ],
    primaryStructureVersionTransformationType:
      StructureVersionTransformationType.FERMETURE,
  },
  [TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureVersionTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
      {
        id: "cada",
        multiple: false,
        type: StructureVersionTransformationType.EXTENSION,
        fixedType: StructureType.CADA,
        inheritOperateurFrom: "huda",
        inheritDepartementFrom: "huda",
        label: "Veuillez sélectionner le CADA qui fait l'objet d'une extension",
      },
    ],
    buildAutoTransformations: () => [],
    prefill: [
      {
        from: StructureVersionTransformationType.FERMETURE,
        to: StructureVersionTransformationType.EXTENSION,
        fields: ["contacts", "antennes", "adresses"],
      },
    ],
  },
  [TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureVersionTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
    ],
    buildAutoTransformations: () => [
      {
        type: StructureVersionTransformationType.CREATION,
        structureType: StructureType.CADA,
      },
    ],
    prefill: [
      {
        from: StructureVersionTransformationType.FERMETURE,
        to: StructureVersionTransformationType.CREATION,
        fields: ["contacts", "antennes", "adresses", "operateur"],
      },
    ],
  },
  [TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureVersionTransformationType.FERMETURE,
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

const CONVENTION_WITH_AVENANT_RULE: CategoryDisplayRule = {
  ...CONVENTION_RULE,
  avenantAlternative: {
    parentCategory: "CONVENTION",
    avenantLabel: "Avenant convention",
  },
};

const HUDA_CADA_CONVENTION_RULE: CategoryDisplayRule = {
  ...CONVENTION_RULE,
  notice:
    "Une nouvelle convention doit être signée tel que publié par décret le 3 janvier 2026. Sa durée doit être équivalente au temps restant de la précédente convention.",
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
      transformationType === TransformationType.OUVERTURE_EX_NIHILO ||
      transformationType ===
        TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR
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
      transformationType === TransformationType.OUVERTURE_EX_NIHILO ||
      transformationType ===
        TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR
        ? undefined
        : ["ARRETE_FUSION"],
  },
  CONVENTION: CONVENTION_RULE,
  ...(transformationType === TransformationType.OUVERTURE_EX_NIHILO
    ? {
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
      }
    : {}),
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
  CONVENTION: CONVENTION_WITH_AVENANT_RULE,
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
    avenantAlternative: {
      parentCategory: "ARRETE_AUTORISATION",
      avenantLabel: "Avenant arrêté d'autorisation",
    },
  },
  AUTRE: {
    ...AUTRE_RULE,
    notice:
      "Pour rappel, dans le cadre d'une extension de grande ampleur, il est obligatoire de mener une visite de conformité au plus tard 3 semaines avant l'ouverture, et son procès-verbal doit être transmis au maximum 15 jours après la visite.",
  },
};

const getExtensionActesAdministratifsCategoryToDisplay = (
  transformationType: TransformationType | undefined
): CategoryDisplayRules => {
  if (
    transformationType ===
    TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR
  ) {
    return {
      ...extensionActesAdministratifsCategoryToDisplay,
      CONVENTION: HUDA_CADA_CONVENTION_RULE,
    };
  }
  return extensionActesAdministratifsCategoryToDisplay;
};

const contractionActesAdministratifsCategoryToDisplay: CategoryDisplayRules = {
  CONVENTION: CONVENTION_WITH_AVENANT_RULE,
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
    avenantAlternative: {
      parentCategory: "ARRETE_AUTORISATION",
      avenantLabel: "Avenant arrêté d'autorisation",
    },
  },
  AUTRE: {
    ...AUTRE_RULE,
    notice:
      "Dans cette catégorie, vous avez la possibilité d'importer d'autres documents utiles à l'analyse de la structure (ex: arrêté modificatif au budget, arrêté de tarification provisoire...).",
  },
};

const collectAvenantParentCategories = (
  ruleSets: CategoryDisplayRules[]
): ActeAdministratifCategory[] => {
  const categories = new Set<ActeAdministratifCategory>();
  for (const ruleSet of ruleSets) {
    for (const rule of Object.values(ruleSet)) {
      if (rule?.avenantAlternative) {
        categories.add(rule.avenantAlternative.parentCategory);
      }
    }
  }
  return [...categories];
};

export const getTransformationActesAdministratifsCategoryToDisplay = (
  structureVersionTransformationType: StructureVersionTransformationType,
  transformationType: TransformationType | undefined
): CategoryDisplayRules => {
  switch (structureVersionTransformationType) {
    case StructureVersionTransformationType.EXTENSION:
      return getExtensionActesAdministratifsCategoryToDisplay(
        transformationType
      );
    case StructureVersionTransformationType.CONTRACTION:
      return contractionActesAdministratifsCategoryToDisplay;
    case StructureVersionTransformationType.FERMETURE:
      return fermetureActesAdministratifsCategoryToDisplay;
    case StructureVersionTransformationType.CREATION:
      return getCreationActesAdministratifsCategoryToDisplay(
        transformationType
      );
  }
};

export const AVENANT_PARENT_CATEGORIES = collectAvenantParentCategories(
  Object.values(StructureVersionTransformationType).map(
    (structureVersionTransformationType) =>
      getTransformationActesAdministratifsCategoryToDisplay(
        structureVersionTransformationType,
        undefined
      )
  )
);

export const STRUCTURE_VERSION_TRANSFORMATION_FORM_NAME: Record<
  StructureVersionTransformationType,
  string
> = {
  [StructureVersionTransformationType.CREATION]:
    "structure-transformation-creation",
  [StructureVersionTransformationType.EXTENSION]:
    "structure-transformation-extension",
  [StructureVersionTransformationType.CONTRACTION]:
    "structure-transformation-contraction",
  [StructureVersionTransformationType.FERMETURE]:
    "structure-transformation-fermeture",
};

export type StructureVersionTransformationFormStepSpec = {
  name: StructureVersionTransformationStep;
  slug: string;
};

const STRUCTURE_VERSION_TRANSFORMATION_COMPLETE_FORM_STEPS: StructureVersionTransformationFormStepSpec[] =
  [
    {
      name: StructureVersionTransformationStep.DESCRIPTION,
      slug: "01-identification",
    },
    {
      name: StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT,
      slug: "02-places-hebergement",
    },
    {
      name: StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
      slug: "03-actes-administratifs",
    },
  ];

const STRUCTURE_VERSION_TRANSFORMATION_FERMETURE_FORM_STEPS: StructureVersionTransformationFormStepSpec[] =
  [
    {
      name: StructureVersionTransformationStep.DESCRIPTION,
      slug: "01-identification",
    },
  ];

export const STRUCTURE_VERSION_TRANSFORMATION_FORM_STEPS: Record<
  string,
  StructureVersionTransformationFormStepSpec[]
> = {
  [STRUCTURE_VERSION_TRANSFORMATION_FORM_NAME[
    StructureVersionTransformationType.CREATION
  ]]: STRUCTURE_VERSION_TRANSFORMATION_COMPLETE_FORM_STEPS,
  [STRUCTURE_VERSION_TRANSFORMATION_FORM_NAME[
    StructureVersionTransformationType.EXTENSION
  ]]: STRUCTURE_VERSION_TRANSFORMATION_COMPLETE_FORM_STEPS,
  [STRUCTURE_VERSION_TRANSFORMATION_FORM_NAME[
    StructureVersionTransformationType.CONTRACTION
  ]]: STRUCTURE_VERSION_TRANSFORMATION_COMPLETE_FORM_STEPS,
  [STRUCTURE_VERSION_TRANSFORMATION_FORM_NAME[
    StructureVersionTransformationType.FERMETURE
  ]]: STRUCTURE_VERSION_TRANSFORMATION_FERMETURE_FORM_STEPS,
};
