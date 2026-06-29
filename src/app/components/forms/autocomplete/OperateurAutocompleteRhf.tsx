"use client";

import { ReactElement } from "react";
import { useController, useFormContext } from "react-hook-form";

import { OperateurAutocomplete } from "./OperateurAutocomplete";

export const OperateurAutocompleteRhf = ({
  disabled,
}: Props): ReactElement => {
  const { field, fieldState } = useController({
    name: "operateur.name",
    rules: { required: true },
  });
  const { setValue } = useFormContext();
  const { field: idField } = useController({
    name: "operateur.id",
    rules: { required: true },
  });

  return (
    <>
      <OperateurAutocomplete
        operateurName={field.value as string | undefined}
        setOperateurName={field.onChange}
        setOperateurId={(id) => setValue("operateur.id", id)}
        inputRef={field.ref}
        onBlurExtra={field.onBlur}
        externalInvalid={fieldState.invalid}
        externalError={fieldState.error?.message}
        disabled={disabled}
      />
      <input aria-hidden="true" type="hidden" {...idField} />
    </>
  );
};

type Props = {
  disabled?: boolean;
};
