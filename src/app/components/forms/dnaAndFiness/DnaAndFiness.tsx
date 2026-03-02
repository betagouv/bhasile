import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { useFormContext } from "react-hook-form";

import { FieldSetDna } from "./FieldSetDna";
import { FieldSetFiness } from "./FieldSetFiness";

export const DnaAndFiness = () => {
  const { watch, setValue } = useFormContext();

  const isMultiDna = watch("isMultiDna");

  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-title-blue-france">
        Code DNA et FINESS
      </h2>
      <Checkbox
        options={[
          {
            label:
              "La structure est répartie sur plusieurs antennes administratives géographiquement distantes. ",
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
      <FieldSetDna />
      <FieldSetFiness />
    </>
  );
};
