import {
  AdditionalFieldsType,
  CategoryDisplayRules,
} from "@/config/acte-administratif.config";

export const operateurActesAdministratifsCategoryToDisplay: CategoryDisplayRules =
  {
    RAPPORT_ACTIVITE_OPERATEUR: {
      categoryShortName: "du rapport",
      title: "Rapport d'activité",
      canAddFile: true,
      canAddAvenant: false,
      isOptional: true,
      shouldShow: true,
      additionalFieldsType: AdditionalFieldsType.DATE,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un rapport",
    },
    FRAIS_DE_SIEGE: {
      categoryShortName: "arrêté",
      title: "Frais de siège",
      canAddFile: true,
      canAddAvenant: false,
      isOptional: true,
      shouldShow: true,
      additionalFieldsType: AdditionalFieldsType.NAME,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter des frais de siège",
    },
    STATUTS: {
      categoryShortName: "du document",
      title: "Statuts",
      canAddFile: true,
      canAddAvenant: false,
      isOptional: true,
      shouldShow: true,
      additionalFieldsType: AdditionalFieldsType.DATE,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter des statuts",
    },
    AUTRE: {
      categoryShortName: "autre",
      title: "Autres documents",
      canAddFile: true,
      canAddAvenant: false,
      isOptional: true,
      shouldShow: true,
      additionalFieldsType: AdditionalFieldsType.NAME,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un document",
    },
  };
