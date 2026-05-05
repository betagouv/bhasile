"use client";

import { ReactElement } from "react";
import {
  FieldValues,
  RegisterOptions,
  useController,
  useFormContext,
  UseFormSetValue,
} from "react-hook-form";

import { AutocompleteSuggestion } from "@/app/hooks/useAutocomplete";

import { AutocompleteField, AutocompleteFieldProps } from "./AutocompleteField";

type Props<T extends AutocompleteSuggestion> = Omit<
  AutocompleteFieldProps<T>,
  | "value"
  | "onValueChange"
  | "onSelect"
  | "onBlurExtra"
  | "inputRef"
  | "name"
  | "externalError"
  | "externalInvalid"
> & {
  name: string;
  rules?: Omit<
    RegisterOptions<FieldValues, string>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
  storeAs?: "label" | "id";
  onAfterSelect?: (
    suggestion: T,
    helpers: { setValue: UseFormSetValue<FieldValues> }
  ) => void;
};

export const AutocompleteFieldRhf = <T extends AutocompleteSuggestion>({
  name,
  rules,
  storeAs = "label",
  onAfterSelect,
  ...rest
}: Props<T>): ReactElement => {
  const { control, setValue } = useFormContext();
  const { field, fieldState } = useController({ name, control, rules });

  return (
    <AutocompleteField<T>
      {...rest}
      name={name}
      value={(field.value as string) ?? ""}
      inputRef={field.ref}
      onValueChange={field.onChange}
      onBlurExtra={field.onBlur}
      onSelect={(suggestion) => {
        const stored =
          storeAs === "label" ? suggestion.label : (suggestion.id ?? "");
        field.onChange(stored);
        onAfterSelect?.(suggestion, { setValue });
      }}
      externalInvalid={fieldState.invalid}
      externalError={fieldState.error?.message}
    />
  );
};
