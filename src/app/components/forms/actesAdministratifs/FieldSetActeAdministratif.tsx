import Button from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { getCategoryLabel } from "@/app/utils/file-upload.util";
import { AdditionalFieldsType } from "@/config/acte-administratif.config";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import { ActeAdministratif } from "./ActeAdministratif";

export default function FieldSetActeAdministratif({
  category,
  categoryShortName,
  title,
  noTitleLegend = false,
  notice,
  isOptional,
  canAddFile,
  canAddAvenant = false,
  avenantCanExtendDateEnd = false,
  addFileButtonLabel,
  additionalFieldsType,
  documentLabel,
  alternativeCategories,
}: FieldSetActeAdministratifProps) {
  const { control, watch, setValue } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: "actesAdministratifs",
  });

  const actesAdministratifs: ActeAdministratifFormValues[] =
    watch("actesAdministratifs") || [];

  const groupCategories: ActeAdministratifCategory[] = [
    category,
    ...(alternativeCategories ?? []),
  ];

  const isInGroup = (acteCategory: ActeAdministratifCategory | undefined) => {
    if (alternativeCategories?.length) {
      return acteCategory === undefined || groupCategories.includes(acteCategory);
    }
    return acteCategory === category;
  };

  const actesOfCategory = actesAdministratifs.filter(
    (acte) => isInGroup(acte?.category) && !acte.parentId && !acte.parentUuid
  );

  const radioActe = alternativeCategories?.length ? actesOfCategory[0] : undefined;
  const radioActeIndex = radioActe
    ? actesAdministratifs.findIndex(
        (acte) =>
          (radioActe.uuid && acte.uuid === radioActe.uuid) ||
          (radioActe.id && acte.id === radioActe.id)
      )
    : -1;

  const handleAddNewField = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    append({
      uuid: uuidv4(),
      category: category,
    });
  };

  const handleDeleteField = (index: number, shouldConfirm = true) => {
    if (shouldConfirm) {
      const confirm = window.confirm(
        "Attention, vous allez supprimer définitivement cet acte administratif. Êtes-vous bien sûr·e de vouloir continuer ?"
      );
      if (!confirm) {
        return;
      }
    }

    const parent = actesAdministratifs[index];
    const avenantIndices = actesAdministratifs
      .map((field, index) => ({ field, index }))
      .filter(
        ({ field }) =>
          (field.parentId && field.parentId === parent?.id) ||
          (field.parentUuid && field.parentUuid === parent?.uuid)
      )
      .map(({ index }) => index);

    const indicesToRemove = [...avenantIndices, index];

    indicesToRemove.sort((a, b) => b - a);

    indicesToRemove.forEach((index) => {
      remove(index);
    });
  };

  return (
    <fieldset className="flex flex-col gap-6 w-full">
      {!noTitleLegend && (
        <legend className="text-xl font-bold mb-4 text-title-blue-france">
          {title} {isOptional && "(optionnel)"}
        </legend>
      )}
      {typeof notice === "string" ? (
        <CustomNotice
          severity="info"
          title=""
          className="rounded [&_p]:flex [&_p]:items-center w-fit"
          description={<>{notice}</>}
        />
      ) : (
        notice
      )}
      {alternativeCategories?.length && radioActeIndex !== -1 && (
        <RadioButtons
          orientation="horizontal"
          name={`actesAdministratifs.${radioActeIndex}.categoryChoice`}
          options={groupCategories.map((groupCategory) => ({
            label: getCategoryLabel(groupCategory),
            nativeInputProps: {
              checked: radioActe?.category === groupCategory,
              onChange: () =>
                setValue(
                  `actesAdministratifs.${radioActeIndex}.category`,
                  groupCategory,
                  { shouldValidate: true, shouldDirty: true }
                ),
            },
          }))}
        />
      )}
      {actesOfCategory &&
        actesOfCategory.length > 0 &&
        actesOfCategory.map((acte) => (
          <div key={acte.id || acte.uuid} className="mb-4">
            <ActeAdministratif
              categoryShortName={categoryShortName}
              acte={acte}
              additionalFieldsType={additionalFieldsType}
              documentLabel={documentLabel}
              handleDeleteField={handleDeleteField}
              canAddAvenant={canAddAvenant}
              avenantCanExtendDateEnd={avenantCanExtendDateEnd}
            />
          </div>
        ))}
      {canAddFile && (
        <Button
          onClick={handleAddNewField}
          priority="tertiary no outline"
          className="underline font-normal p-0"
        >
          + {addFileButtonLabel ?? "Ajouter un fichier"}
        </Button>
      )}
    </fieldset>
  );
}

type FieldSetActeAdministratifProps = {
  category: ActeAdministratifCategory;
  categoryShortName: string;
  title: string;
  noTitleLegend?: boolean;
  notice?: string | React.ReactElement;
  isOptional?: boolean;
  canAddFile?: boolean;
  canAddAvenant?: boolean;
  avenantCanExtendDateEnd?: boolean;
  addFileButtonLabel?: string;
  additionalFieldsType?: AdditionalFieldsType;
  documentLabel: string;
  alternativeCategories?: ActeAdministratifCategory[];
};
