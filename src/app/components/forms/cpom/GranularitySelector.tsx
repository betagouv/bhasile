import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useController, useFormContext } from "react-hook-form";

export const GranularitySelector = () => {
  const { control } = useFormContext();

  const { field } = useController({
    name: "granularity",
    control,
  });

  return (
    <div className="flex gap-6 items-center">
      <p aria-hidden="true" className="mb-3">
        Quelle est l’échelle du CPOM ?
      </p>

      <RadioButtons
        legend="Quelle est l’échelle du CPOM ?"
        classes={{ legend: "fr-sr-only" }}
        name="granularity"
        options={[
          {
            label: "Départementale",
            nativeInputProps: {
              ...field,
              value: "DEPARTEMENTALE",
              checked: field.value === "DEPARTEMENTALE",
            },
          },
          {
            label: "Interdépartementale",
            nativeInputProps: {
              ...field,
              value: "INTERDEPARTEMENTALE",
              checked: field.value === "INTERDEPARTEMENTALE",
            },
          },
          {
            label: "Régionale",
            nativeInputProps: {
              ...field,
              value: "REGIONALE",
              checked: field.value === "REGIONALE",
            },
          },
        ]}
        orientation="horizontal"
      />
    </div>
  );
};
