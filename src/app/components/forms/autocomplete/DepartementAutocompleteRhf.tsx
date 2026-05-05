"use client";

import { ReactElement } from "react";
import { useController } from "react-hook-form";

import { DepartementAutocomplete } from "./DepartementAutocomplete";

export const DepartementAutocompleteRhf = (): ReactElement => {
  const { field, fieldState } = useController({
    name: "departement.numero",
    rules: { required: true },
  });

  return (
    <DepartementAutocomplete
      departementNumero={field.value as string | undefined}
      setDepartementNumero={field.onChange}
      inputRef={field.ref}
      onBlurExtra={field.onBlur}
      externalInvalid={fieldState.invalid}
      externalError={fieldState.error?.message}
    />
  );
};
