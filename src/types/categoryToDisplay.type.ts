import { ActeAdministratifCategoryType } from "./file-upload.type";

export type CategoryDisplayRulesType = Record<
  Exclude<
    ActeAdministratifCategoryType[number],
    "INSPECTION_CONTROLE" | "EVALUATION"
  >,
  {
    categoryShortName: string;
    title: string;
    canAddFile: boolean;
    canAddAvenant: boolean;
    isOptional: boolean;
    additionalFieldsType: AdditionalFieldsType;
    documentLabel: string;
    addFileButtonLabel: string;
    notice?: string | React.ReactElement;
  }
>;

export enum AdditionalFieldsType {
  DATE_START_END,
  NAME,
}
