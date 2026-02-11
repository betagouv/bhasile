import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";
import { useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import InputWithValidation from "@/app/components/forms/InputWithValidation";
import UploadWithValidation from "@/app/components/forms/UploadWithValidation";
import { AdditionalFieldsType } from "@/app/utils/categoryToDisplay.util";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";

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

  const actesAdministratifs: ActeAdministratifFormValues[] =
    watch("actesAdministratifs") || [];

  const index = actesAdministratifs.findIndex(
    (acteAdministratif: ActeAdministratifFormValues) =>
      acteAdministratif.uuid === acte.uuid || acteAdministratif.id === acte.id
  );

  const avenants = actesAdministratifs.filter(
    (avenant) => avenant.parentId === acte.id
  );

  const handleAddNewAvenant = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    append({
      uuid: uuidv4(),
      category: acte.category,
      parentId: acte.id,
    });
  };

  return (
    <>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-6 items-start">
        <InputWithValidation
          name="actesAdministratifs.${index}.id"
          control={control}
          label=""
          type="hidden"
        />
        <InputWithValidation
          name="actesAdministratifs.${index}.parentId"
          control={control}
          label=""
          type="hidden"
        />
        <InputWithValidation
          name="actesAdministratifs.${index}.category"
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
              name={`actesAdministratifs.${index}.categoryName`}
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
            name={`actesAdministratifs.${index}.key`}
            control={control}
          />
        </div>
        {index > 0 && (
          <Button
            iconId="fr-icon-delete-bin-line"
            priority="tertiary no outline"
            className="mt-8"
            title="Supprimer"
            onClick={() => handleDeleteField(index)}
            type="button"
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
            <Link
              href={"/"}
              className="text-action-high-blue-france underline underline-offset-4"
              onClick={handleAddNewAvenant}
            >
              + Ajouter un avenant
            </Link>
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
  handleDeleteField: (index: number) => void;
  canAddAvenant: boolean;
  avenantCanExtendDateEnd?: boolean;
};
