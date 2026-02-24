"use client";

import Select from "@codegouvfr/react-dsfr/Select";
import * as React from "react";
import {
  Control,
  FieldValues,
  useController,
  UseControllerProps,
} from "react-hook-form";

export default function SelectWithValidation<
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  id,
  control,
  label,
  required,
  children,
  disabled,
  onChange,
  hidden = false,
  className,
}: SelectWithValidationProps<TFieldValues>) {
  const finalControl = control;

  const { field, fieldState } = useController({
    name,
    control: finalControl,
    rules: {
      required,
    },
  });

  return hidden ? (
    <input
      {...field}
      value={field.value ?? ""}
      onChange={field.onChange}
      aria-hidden="true"
      type="hidden"
    />
  ) : (
    <Select
      label={label}
      nativeSelectProps={{
        ...field,
        id,
        onChange: (e) => {
          field.onChange(e);
          onChange?.(e.target.value);
        },
      }}
      disabled={disabled}
      state={fieldState.invalid ? "error" : "default"}
      stateRelatedMessage={fieldState.error?.message}
      className={className}
    >
      {children}
    </Select>
  );
}

type SelectWithValidationProps<TFieldValues extends FieldValues = FieldValues> =
  Partial<UseControllerProps<TFieldValues>> & {
    name: string;
    id?: string;
    label: string;
    control?: Control<TFieldValues>;
    required?: boolean;
    children: React.ReactNode;
    disabled?: boolean;
    onChange?: (value: string) => void;
    hidden?: boolean;
    className?: string;
  };
