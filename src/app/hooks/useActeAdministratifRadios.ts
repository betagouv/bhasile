import { RadioButtonsProps } from "@codegouvfr/react-dsfr/RadioButtons";
import { useFormContext } from "react-hook-form";

import { getCategoryGroup } from "@/app/utils/acteAdministratif.util";
import { getCategoryLabel } from "@/app/utils/file-upload.util";
import { lowercaseFirstLetter } from "@/app/utils/string.util";
import {
  AdditionalFieldsType,
  AvenantAlternative,
} from "@/config/acte-administratif.config";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { StructureType } from "@/types/structure.type";

export const useActeAdministratifRadios = ({
  category,
  title,
  additionalFieldsType,
  alternativeCategories,
  avenantAlternative,
  structureScope,
}: UseActeAdministratifRadiosArgs): UseActeAdministratifRadios => {
  const { watch, setValue } = useFormContext();

  const actesAdministratifs: ActeAdministratifFormValues[] =
    watch("actesAdministratifs") || [];

  const resolvedParent = avenantAlternative?.resolvedParent;
  const canCreateAvenant = resolvedParent != null;

  const groupCategories = getCategoryGroup(
    category,
    alternativeCategories,
    avenantAlternative?.parentCategory
  );

  const hasAlternatives =
    !!alternativeCategories?.length || !!avenantAlternative;

  const isInGroup = (acteCategory: ActeAdministratifCategory | undefined) => {
    if (hasAlternatives) {
      return (
        acteCategory === undefined || groupCategories.includes(acteCategory)
      );
    }
    return acteCategory === category;
  };

  const isInScope = (acte: ActeAdministratifFormValues) =>
    structureScope === undefined ||
    (acte.structureType ?? null) === structureScope;

  const actesOfCategory = actesAdministratifs.filter((acte) => {
    if (!isInGroup(acte?.category) || !isInScope(acte)) {
      return false;
    }
    if (!acte.parentId && !acte.parentUuid) {
      return true;
    }
    return (
      !!avenantAlternative &&
      acte.category === avenantAlternative.parentCategory
    );
  });

  const primaryActe = hasAlternatives ? actesOfCategory[0] : undefined;
  const primaryActeIndex = primaryActe
    ? actesAdministratifs.findIndex(
        (acte) =>
          (primaryActe.uuid && acte.uuid === primaryActe.uuid) ||
          (primaryActe.id && acte.id === primaryActe.id)
      )
    : -1;

  const isAvenantSelected = !!primaryActe?.parentId;

  const clearUnusedDateFields = (
    index: number,
    shape: AdditionalFieldsType | undefined
  ) => {
    if (shape === AdditionalFieldsType.DATE) {
      setValue(`actesAdministratifs.${index}.startDate`, "");
      setValue(`actesAdministratifs.${index}.endDate`, "");
    } else if (shape === AdditionalFieldsType.DATE_START_END) {
      setValue(`actesAdministratifs.${index}.date`, undefined);
    }
  };

  const selectStandalone = (index: number) => {
    setValue(`actesAdministratifs.${index}.category`, category, {
      shouldValidate: true,
    });
    setValue(`actesAdministratifs.${index}.parentId`, undefined);
    clearUnusedDateFields(index, additionalFieldsType);
  };

  const selectAvenant = (index: number) => {
    if (!avenantAlternative || !resolvedParent) {
      return;
    }
    setValue(
      `actesAdministratifs.${index}.category`,
      avenantAlternative.parentCategory,
      { shouldValidate: true }
    );
    setValue(`actesAdministratifs.${index}.parentId`, resolvedParent.id);
    clearUnusedDateFields(index, AdditionalFieldsType.DATE);
  };

  const categoryRadio: RadioConfig | null =
    alternativeCategories?.length && primaryActeIndex !== -1
      ? {
          name: `actesAdministratifs.${primaryActeIndex}.categoryChoice`,
          options: groupCategories.map((groupCategory) => ({
            label: getCategoryLabel(groupCategory),
            nativeInputProps: {
              checked: primaryActe?.category === groupCategory,
              onChange: () =>
                setValue(
                  `actesAdministratifs.${primaryActeIndex}.category`,
                  groupCategory,
                  { shouldValidate: true }
                ),
            },
          })),
        }
      : null;

  const avenantRadio: RadioConfig | null =
    avenantAlternative && resolvedParent && primaryActeIndex !== -1
      ? {
          name: `actesAdministratifs.${primaryActeIndex}.avenantChoice`,
          options: [
            {
              label: title,
              nativeInputProps: {
                checked: !isAvenantSelected,
                onChange: () => selectStandalone(primaryActeIndex),
              },
            },
            {
              label: `${avenantAlternative.avenantLabel} ${resolvedParent.startYear} - ${resolvedParent.endYear}`,
              nativeInputProps: {
                checked: isAvenantSelected,
                onChange: () => selectAvenant(primaryActeIndex),
              },
            },
          ],
        }
      : null;

  const getAdditionalFieldsType = (acte: ActeAdministratifFormValues) =>
    acte.parentId || acte.parentUuid
      ? AdditionalFieldsType.DATE
      : additionalFieldsType;

  const legend =
    avenantAlternative && canCreateAvenant && primaryActeIndex !== -1
      ? `${title} ou ${lowercaseFirstLetter(avenantAlternative.avenantLabel)}`
      : title;

  return {
    actesOfCategory,
    legend,
    categoryRadio,
    avenantRadio,
    getAdditionalFieldsType,
  };
};

type UseActeAdministratifRadiosArgs = {
  category: ActeAdministratifCategory;
  title: string;
  additionalFieldsType?: AdditionalFieldsType;
  alternativeCategories?: ActeAdministratifCategory[];
  avenantAlternative?: AvenantAlternative;
  structureScope?: StructureType | null;
};

type RadioConfig = {
  name: string;
  options: RadioButtonsProps["options"];
};

type UseActeAdministratifRadios = {
  actesOfCategory: ActeAdministratifFormValues[];
  legend: string;
  categoryRadio: RadioConfig | null;
  avenantRadio: RadioConfig | null;
  getAdditionalFieldsType: (
    acte: ActeAdministratifFormValues
  ) => AdditionalFieldsType | undefined;
};
