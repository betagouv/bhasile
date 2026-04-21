import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { FormKind } from "@/types/global";

import { DnaInput } from "../adresseAdministrativeAndAntenne/DnaInput";
import InputWithValidation from "../InputWithValidation";
import { FieldSetDna } from "./FieldSetDna";
import { FieldSetFiness } from "./FieldSetFiness";

export const DnaAndFiness = ({ formKind = FormKind.FINALISATION }: Props) => {
  const { watch, control, setValue } = useFormContext();

  const isMultiDna = watch("isMultiDna");
  const isAutorisee = isStructureAutorisee(watch("type"));
  const isSubventionnee = isStructureSubventionnee(watch("type"));

  let checkboxLabel = `La structure dispose de plusieurs codes DNA${isAutorisee ? " et/ou FINESS" : ""}.`;
  if (isSubventionnee && formKind === FormKind.MODIFICATION) {
    checkboxLabel = "La structure dispose de plusieurs codes FINESS";
  }

  useEffect(() => {
    if (!isMultiDna) {
      setValue("dnaStructures", [watch("dnaStructures")?.[0]]);
      setValue("finesses", [watch("finesses")?.[0]]);
    }
  }, [isMultiDna, setValue, watch]);

  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-title-blue-france">
        Code DNA{isAutorisee && " et FINESS"}
      </h2>
      {!isAutorisee || formKind !== FormKind.MODIFICATION ? (
        <Checkbox
          options={[
            {
              label: checkboxLabel,
              nativeInputProps: {
                name: "isMultiDna",
                checked: isMultiDna,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  setValue("isMultiDna", e.target.checked);
                },
              },
            },
          ]}
        />
      ) : null}
      {isMultiDna ? (
        <>
          <FieldSetDna formKind={formKind} />
          {isAutorisee && <FieldSetFiness />}
        </>
      ) : (
        <div className="grid grid-cols-3 gap-6 flex-1">
          <DnaInput
            index={0}
            label="Code DNA"
            disabled={formKind === FormKind.MODIFICATION}
          />
          {isAutorisee && (
            <InputWithValidation
              name="finesses.0.code"
              id="finesses.0.code"
              control={control}
              type="text"
              label="Code FINESS"
            />
          )}
        </div>
      )}
    </>
  );
};

type Props = {
  formKind?: FormKind;
};
