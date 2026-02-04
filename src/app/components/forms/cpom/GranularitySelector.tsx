import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useController, useFormContext } from "react-hook-form";

import { CpomGranularity } from "@/types/cpom.type";

export const GranularitySelector = () => {
  const { control } = useFormContext();

  const { field } = useController({
    name: "granularity",
    control,
  });

  return (
    <div className="flex gap-6 items-center">
      <label htmlFor="granularity" className="mb-3">
        Quelle est l’échelle du CPOM ?
      </label>

      <RadioButtons
        legend=""
        name="granularity"
        options={[
          {
            label: "Départementale",
            nativeInputProps: {
              ...field,
              value: CpomGranularity.DEPARTEMENTALE,
              checked: field.value === CpomGranularity.DEPARTEMENTALE,
            },
          },
          {
            label: "Interdépartementale",
            nativeInputProps: {
              ...field,
              value: CpomGranularity.INTERDEPARTEMENTALE,
              checked: field.value === CpomGranularity.INTERDEPARTEMENTALE,
            },
          },
          {
            label: "Régionale",
            nativeInputProps: {
              ...field,
              value: CpomGranularity.REGIONALE,
              checked: field.value === CpomGranularity.REGIONALE,
            },
          },
        ]}
        orientation="horizontal"
      />
    </div>
  );
};
