import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";

import InputWithValidation from "../InputWithValidation";
import UploadWithValidation from "../UploadWithValidation";

export const Avenant = ({
  avenant,
  categoryShortName,
  avenantCanExtendDateEnd,
  documentLabel,
  handleDeleteField,
}: Props) => {
  const { control, watch } = useFormContext();

  const [showEndDateInput, setShowEndDateInput] = useState<boolean>(false);

  const actesAdministratifs: ActeAdministratifFormValues[] =
    watch("actesAdministratifs") || [];

  const index = actesAdministratifs.findIndex(
    (acteAdministratif) =>
      (avenant.uuid !== undefined && acteAdministratif.uuid === avenant.uuid) ||
      (avenant.id !== undefined && acteAdministratif.id === avenant.id)
  );

  console.log(index, avenant, actesAdministratifs);

  return (
    <span key={`${avenant.uuid}`}>
      <div className="grid grid-cols-2 gap-6 my-6">
        <div>
          <div className="flex gap-6 items-start">
            <InputWithValidation
              name={`actesAdministratifs.${index}.date`}
              control={control}
              label="Date avenant"
              className="w-full mb-0"
              type="date"
            />
            {showEndDateInput && (
              <InputWithValidation
                name={`actesAdministratifs.${index}.endDate`}
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
                    value: "showEndDateInput",
                    checked: showEndDateInput,
                    onChange: () => {
                      setShowEndDateInput(
                        (prevShowEndDateInput) => !prevShowEndDateInput
                      );
                    },
                  },
                },
              ]}
              className="mt-3"
              small
            />
          )}
        </div>
        <div className="flex">
          <div className="flex flex-col w-full">
            <label className="mb-2">{documentLabel}</label>
            <UploadWithValidation
              name={`actesAdministratifs.${index}.fileUploads.0.key`}
              control={control}
            />
          </div>
          <Button
            iconId="fr-icon-delete-bin-line"
            onClick={() => handleDeleteField(index)}
            type="button"
            priority="tertiary no outline"
            className="mt-8"
            title="Supprimer"
          />
        </div>
      </div>
    </span>
  );
};

type Props = {
  avenant: ActeAdministratifFormValues;
  categoryShortName: string;
  avenantCanExtendDateEnd: boolean;
  documentLabel: string;
  handleDeleteField: (index: number) => void;
};
