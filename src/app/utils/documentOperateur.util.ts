import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { DocumentOperateurCategory } from "@/types/operateur.type";

export const getDocumentsOperateurCategories =
  (): CategoryDisplayRulesType => ({
    RAPPORT_ACTIVITE_OPERATEUR: {
      categoryShortName: "convention",
      title: "Rapport d'activité",
      canAddFile: true,
      isOptional: true,
      additionalFieldsType: AdditionalFieldsType.START_END_DATE,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un rapport d'activité",
    },
    FRAIS_DE_SIEGE: {
      categoryShortName: "arrêté",
      title: "Frais de siège",
      canAddFile: true,
      isOptional: true,
      additionalFieldsType: AdditionalFieldsType.START_END_DATE,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un frais de siège",
    },
    STATUTS: {
      categoryShortName: "Date du document",
      title: "Statuts",
      canAddFile: true,
      isOptional: true,
      additionalFieldsType: AdditionalFieldsType.DATE,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un statut",
    },
    AUTRE: {
      categoryShortName: "autre",
      title: "Autres documents",
      canAddFile: true,
      isOptional: true,
      additionalFieldsType: AdditionalFieldsType.NAME,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un document",
    },
  });

type CategoryDisplayRulesType = Record<
  Exclude<
    DocumentOperateurCategory | ActeAdministratifCategory,
    | "RAPPORT_ACTIVITE"
    | "ARRETE_AUTORISATION"
    | "CONVENTION"
    | "ARRETE_TARIFICATION"
    | "CPOM"
  >,
  {
    categoryShortName: string;
    title: string;
    canAddFile: boolean;
    isOptional: boolean;
    additionalFieldsType: AdditionalFieldsType;
    documentLabel: string;
    addFileButtonLabel: string;
  }
>;

export enum AdditionalFieldsType {
  START_END_DATE,
  DATE,
  NAME,
}
