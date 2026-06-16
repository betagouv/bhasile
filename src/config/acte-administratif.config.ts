import type { ReactElement } from "react";

import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export enum AdditionalFieldsType {
  DATE_START_END,
  DATE,
  NAME,
}

export type ResolvedAvenantParent = {
  id: number;
  startYear: number;
  endYear: number;
};

export type AvenantAlternative = {
  parentCategory: ActeAdministratifCategory;
  avenantLabel: string;
  resolvedParent?: ResolvedAvenantParent;
};

export type CategoryDisplayRule = {
  categoryShortName: string;
  title: string;
  canAddFile: boolean;
  canAddAvenant: boolean;
  isOptional: boolean;
  shouldShow: boolean;
  additionalFieldsType: AdditionalFieldsType;
  documentLabel: string;
  addFileButtonLabel: string;
  notice?: string | ReactElement;
  alternativeCategories?: ActeAdministratifCategory[];
  avenantAlternative?: AvenantAlternative;
};

export type CategoryDisplayRules = Partial<
  Record<ActeAdministratifCategory, CategoryDisplayRule>
>;
