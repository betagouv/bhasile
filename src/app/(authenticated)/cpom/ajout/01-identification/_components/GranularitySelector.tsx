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
    <RadioButtons
      legend="Quelle est l’échelle du CPOM ?"
      name="granularity"
      options={[
        {
          label: "Départemental",
          nativeInputProps: {
            ...field,
            value: CpomGranularity.DEPARTEMENTALE,
            checked: field.value === CpomGranularity.DEPARTEMENTALE,
          },
        },
        {
          label: "Interdépartemental",
          nativeInputProps: {
            ...field,
            value: CpomGranularity.INTERDEPARTEMENTALE,
            checked: field.value === CpomGranularity.INTERDEPARTEMENTALE,
          },
        },
        {
          label: "Régional",
          nativeInputProps: {
            ...field,
            value: CpomGranularity.REGIONALE,
            checked: field.value === CpomGranularity.REGIONALE,
          },
        },
      ]}
      orientation="horizontal"
    />
  );
};
