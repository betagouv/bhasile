import Button from "@codegouvfr/react-dsfr/Button";
import Notice from "@codegouvfr/react-dsfr/Notice";
import { useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import { AdditionalFieldsType } from "@/app/utils/acteAdministratif.util";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import { ActeAdministratif } from "../../actesAdministratifs/ActeAdministratif";

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
}: FieldSetActeAdministratifProps) {
  const { control, watch } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: "actesAdministratifs",
  });

  const actesAdministratifs: ActeAdministratifFormValues[] =
    watch("actesAdministratifs") || [];

  const actesOfCategory = actesAdministratifs.filter(
    (acte) => acte?.category === category && !acte.parentId && !acte.parentUuid
  );

  const handleAddNewField = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    append({
      uuid: uuidv4(),
      category: category,
    });
  };

  const handleDeleteField = (index: number) => {
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
      {notice && (
        <Notice
          severity="info"
          title=""
          className="rounded [&_p]:flex [&_p]:items-center w-fit [&_.fr-notice\_\_desc]:text-text-default-grey"
          description={<>{notice}</>}
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
          + {addFileButtonLabel}
        </Button>
      )}
    </fieldset>
  );
}

type FieldSetActeAdministratifProps = {
  category: ActeAdministratifCategory[number];
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
};
