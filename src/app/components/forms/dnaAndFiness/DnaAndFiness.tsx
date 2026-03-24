import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { useFormContext } from "react-hook-form";

import { isStructureAutorisee } from "@/app/utils/structure.util";
import { FormKind } from "@/types/global";

import { DnaInput } from "../adresseAdministrativeAndAntenne/DnaInput";
import InputWithValidation from "../InputWithValidation";
import { FieldSetDna } from "./FieldSetDna";
import { FieldSetFiness } from "./FieldSetFiness";

export const DnaAndFiness = ({ formKind = FormKind.FINALISATION }: Props) => {
  const { watch, control, setValue } = useFormContext();

  const isMultiDna = watch("isMultiDna");
  const isAutorisee = isStructureAutorisee(watch("type"));

  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-title-blue-france">
        Code DNA et FINESS
      </h2>
      <Checkbox
        options={[
          {
            label: "La structure dispose de plusieurs codes DNA et/ou FINESS.",
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
      {isMultiDna ? (
        <>
          <FieldSetDna formKind={formKind} />
          {isAutorisee && <FieldSetFiness />}
        </>
      ) : (
        <div className="grid grid-cols-3 gap-6 flex-1">
          <DnaInput index={0} disabled label="Code DNA" />
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
