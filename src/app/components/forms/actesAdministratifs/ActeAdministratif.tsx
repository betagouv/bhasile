import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect, useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import InputWithValidation from "@/app/components/forms/InputWithValidation";
import UploadWithValidation from "@/app/components/forms/UploadWithValidation";
import { AdditionalFieldsType } from "@/app/utils/acteAdministratif.util";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";

import { DeleteButton } from "../../common/DeleteButton";
import { Avenant } from "./Avenant";

export const ActeAdministratif = ({
  acte,
  additionalFieldsType = AdditionalFieldsType.DATE_START_END,
  documentLabel,
  handleDeleteField,
  canAddAvenant = false,
  avenantCanExtendDateEnd = false,
  categoryShortName,
}: UploadsByCategoryFileProps) => {
  const { control, watch } = useFormContext();

  const { append } = useFieldArray({
    control,
    name: "actesAdministratifs",
  });

  // Watch is already memoized by react-hook-form
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const actesAdministratifs: ActeAdministratifFormValues[] =
    watch("actesAdministratifs") || [];

  const index = actesAdministratifs.findIndex(
    (acteAdministratif) =>
      (acteAdministratif.uuid && acteAdministratif.uuid === acte.uuid) ||
      (acteAdministratif.id && acteAdministratif.id === acte.id)
  );

  const avenants = actesAdministratifs.filter((avenant) => {
    return (
      (avenant.parentId && avenant.parentId === acte.id) ||
      (avenant.parentUuid && avenant.parentUuid === acte.uuid)
    );
  });

  const fileKey = watch(`actesAdministratifs.${index}.fileUploads.0.key`);

  const avenantIndices = useMemo(() => {
    return avenants
      .map((avenant) =>
        actesAdministratifs.findIndex(
          (acteAdministratif) =>
            (acteAdministratif.uuid &&
              acteAdministratif.uuid === avenant.uuid) ||
            (acteAdministratif.id && acteAdministratif.id === avenant.id)
        )
      )
      .sort((a, b) => b - a);
  }, [avenants, actesAdministratifs]);

  useEffect(() => {
    if (!fileKey) {
      avenantIndices.forEach((avenantIndex) => {
        if (avenantIndex !== -1) {
          handleDeleteField(avenantIndex, false);
        }
      });
    }
  }, [fileKey, handleDeleteField, index, avenantIndices]);

  const handleAddNewAvenant = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!fileKey) {
      alert(
        "Impossible d'ajouter un avenant sans document principal. Si vous ne retrouvez pas le document original, merci de joindre un court document résumant en une ligne pourquoi il est indisponible."
      );
      return;
    }

    append({
      uuid: uuidv4(),
      category: acte.category,
      parentId: acte.id,
      parentUuid: acte.uuid,
    });
  };

  if (index === -1) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-6 items-start">
        <InputWithValidation
          name={`actesAdministratifs.${index}.id`}
          control={control}
          label=""
          type="hidden"
        />
        <InputWithValidation
          name={`actesAdministratifs.${index}.parentId`}
          control={control}
          label=""
          type="hidden"
        />
        <InputWithValidation
          name={`actesAdministratifs.${index}.category`}
          control={control}
          label=""
          type="hidden"
        />

        {additionalFieldsType === AdditionalFieldsType.DATE_START_END && (
          <div className="flex gap-6 items-start h-full">
            <InputWithValidation
              name={`actesAdministratifs.${index}.startDate`}
              defaultValue={acte.startDate}
              control={control}
              label={`Début ${categoryShortName}`}
              className="w-full mb-0"
              type="date"
            />

            <InputWithValidation
              name={`actesAdministratifs.${index}.endDate`}
              control={control}
              label={`Fin ${categoryShortName}`}
              className="w-full mb-0"
              type="date"
            />
          </div>
        )}
        {additionalFieldsType === AdditionalFieldsType.NAME && (
          <div className="flex gap-6 items-start h-full">
            <InputWithValidation
              name={`actesAdministratifs.${index}.name`}
              control={control}
              label="Nom du document"
              className="w-full mb-0"
              type="text"
              hintText="32 caractères maximum"
            />
          </div>
        )}

        <div className="flex flex-col">
          <label className="mb-2">{documentLabel}</label>
          <UploadWithValidation
            name={`actesAdministratifs.${index}.fileUploads.0.key`}
            control={control}
          />
        </div>
        {index > 0 && (
          <DeleteButton
            onClick={() => handleDeleteField(index)}
            backgroundColor="grey"
            className="mt-8"
          />
        )}
      </div>
      {canAddAvenant && (
        <div className="flex flex-col ml-8 pl-8 border-l-2 border-default-grey">
          {avenants?.map((avenant) => (
            <Avenant
              key={avenant.id || avenant.uuid}
              avenant={avenant}
              categoryShortName={categoryShortName}
              avenantCanExtendDateEnd={avenantCanExtendDateEnd}
              documentLabel={documentLabel}
              handleDeleteField={handleDeleteField}
            />
          ))}
          {canAddAvenant && (
            <Button
              type="button"
              priority="tertiary no outline"
              className="text-action-high-blue-france underline underline-offset-4"
              onClick={handleAddNewAvenant}
            >
              + Ajouter un avenant
            </Button>
          )}
        </div>
      )}
    </>
  );
};

type UploadsByCategoryFileProps = {
  acte: ActeAdministratifFormValues;
  additionalFieldsType?: AdditionalFieldsType;
  documentLabel: string;
  categoryShortName: string;
  handleDeleteField: (index: number, shouldConfirm?: boolean) => void;
  canAddAvenant: boolean;
  avenantCanExtendDateEnd?: boolean;
};
