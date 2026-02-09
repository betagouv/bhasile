import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Link from "next/link";
import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import InputWithValidation from "@/app/components/forms/InputWithValidation";
import UploadWithValidation from "@/app/components/forms/UploadWithValidation";
import { AdditionalFieldsType } from "@/types/categoryToDisplay.type";

import { ActeAdministratifField } from "./UploadsByCategory";

export const UploadsByCategoryFile = ({
  field,
  index,
  additionalFieldsType,
  documentLabel,
  handleDeleteField,
  canAddAvenant = false,
  avenantCanExtendDateEnd = false,
  categoryShortName,
}: UploadsByCategoryFileProps) => {
  const { control, register, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "actesAdministratifs",
  });

  register(`actesAdministratifs.${index}.id`);
  register(`actesAdministratifs.${index}.parentFileUploadId`);

  const watchFieldName = `actesAdministratifs.${index}.id`;
  const mainFileId = watch(watchFieldName);

  let avenants = fields.filter(
    (field) =>
      (field as unknown as ActeAdministratifField).parentFileUploadId ===
      mainFileId
  ) as ActeAdministratifField[];

  const [showAvenantEndDateInput, setShowAvenantEndDateInput] = useState<
    string[]
  >(
    avenants
      .filter((avenant) => avenant.endDate)
      .map((avenant) => avenant.id ?? avenant.uuid)
  );

  const getAvenantIndex = (id: string) => {
    const index = fields.findIndex(
      (f) =>
        (f as unknown as ActeAdministratifField).uuid === id ||
        (f as unknown as ActeAdministratifField).id === id
    );
    return index;
  };

  const handleDeleteAvenant = (index: number) => {
    remove(index);
    avenants = fields.filter(
      (field) =>
        (field as unknown as ActeAdministratifField).parentFileUploadId ===
        mainFileId
    ) as ActeAdministratifField[];
  };

  const handleAddNewAvenant = (
    e: React.MouseEvent,
    parentFileUploadId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const newField = {
      key: null,
      category: field.category,
      uuid: uuidv4(),
      parentFileUploadId: parentFileUploadId || undefined,
    };

    append(newField);
  };

  return (
    <>
      <div className="flex gap-6 items-center mb-4">
        {additionalFieldsType === AdditionalFieldsType.DATE_START_END && (
          <div className="flex gap-6 items-center h-full flex-1">
            <InputWithValidation
              name={`actesAdministratifs.${index}.startDate`}
              defaultValue={field.startDate}
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
          <input
            type="hidden"
            {...register(`actesAdministratifs.${index}.category`)}
            defaultValue={field.category}
          />
        </div>
        {index > 0 ? (
          <Button
            iconId="fr-icon-delete-bin-line"
            priority="tertiary no outline"
            className="mt-8 !rounded-full !bg-default-grey-hover"
            title="Supprimer"
            onClick={() => handleDeleteField(index)}
            type="button"
            size="small"
          />
        ) : (
          <div className="w-12" />
        )}
      </div>
      {canAddAvenant && (
        <div className="flex flex-col ml-8 pl-8 border-l-2 border-default-grey">
          {avenants?.map((avenant) => {
            const avenantIndex = getAvenantIndex(avenant.id ?? avenant.uuid);
            return (
              <span key={`${avenant.id ?? avenant.uuid}`}>
                <div className="grid grid-cols-2 gap-6 my-6">
                  <div>
                    <div className="flex gap-6 items-start">
                      <InputWithValidation
                        name={`actesAdministratifs.${avenantIndex}.date`}
                        control={control}
                        label="Date avenant"
                        className="w-full mb-0"
                        type="date"
                      />
                      {(showAvenantEndDateInput.includes(avenant.uuid) ||
                        showAvenantEndDateInput.includes(avenant.id)) && (
                        <InputWithValidation
                          name={`actesAdministratifs.${avenantIndex}.endDate`}
                          control={control}
                          label={`Fin ${categoryShortName} actualisée`}
                          className="w-full mb-0"
                          type="date"
                        />
                      )}
                    </div>
                    {avenantCanExtendDateEnd && (
                      <Checkbox
                        options={[
                          {
                            label: `Cet avenant modifie la date de fin du ${categoryShortName}.`,
                            nativeInputProps: {
                              name: "",
                              value: "showAvenantEndDateInput",
                              checked: showAvenantEndDateInput.includes(
                                avenant.id ?? avenant.uuid
                              ),
                              onChange: () => {
                                if (
                                  showAvenantEndDateInput.includes(
                                    avenant.id ?? avenant.uuid
                                  ) ||
                                  showAvenantEndDateInput.includes(avenant.id)
                                ) {
                                  setShowAvenantEndDateInput(
                                    showAvenantEndDateInput.filter(
                                      (id) =>
                                        id !== (avenant.id ?? avenant.uuid)
                                    )
                                  );
                                  setValue(
                                    `actesAdministratifs.${avenantIndex}.endDate`,
                                    undefined
                                  );
                                } else {
                                  setShowAvenantEndDateInput([
                                    ...showAvenantEndDateInput,
                                    avenant.uuid,
                                  ]);
                                }
                              },
                            },
                          },
                        ]}
                        className="mt-3"
                        small
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <label className="mb-2">{documentLabel}</label>
                      <UploadWithValidation
                        name={`actesAdministratifs.${avenantIndex}.key`}
                        control={control}
                      />
                      <input
                        type="hidden"
                        {...register(
                          `actesAdministratifs.${avenantIndex}.category`
                        )}
                        defaultValue={avenant.category}
                      />
                    </div>
                    <Button
                      iconId="fr-icon-delete-bin-line"
                      onClick={() => handleDeleteAvenant(avenantIndex)}
                      type="button"
                      priority="tertiary no outline"
                      className="!rounded-full !bg-default-grey-hover"
                      title="Supprimer"
                      size="small"
                    />
                  </div>
                </div>
              </span>
            );
          })}
          {canAddAvenant && mainFileId && (
            <Link
              href={"/"}
              className="text-action-high-blue-france underline underline-offset-4"
              onClick={(e) => handleAddNewAvenant(e, mainFileId)}
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
  field: ActeAdministratifField;
  index: number;
  additionalFieldsType: AdditionalFieldsType;
  documentLabel: string;
  categoryShortName: string;
  handleDeleteField: (index: number) => void;
  canAddAvenant: boolean;
  avenantCanExtendDateEnd?: boolean;
};
