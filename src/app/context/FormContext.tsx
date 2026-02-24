"use client";

import { createContext, ReactNode, useContext } from "react";
import { UseFormReturn } from "react-hook-form";

const FormContext = createContext<UseFormReturn<
  Record<string, unknown>
> | null>(null);

export function FormProvider<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>({
  children,
  formMethods,
}: {
  children: ReactNode;
  formMethods: UseFormReturn<TFormValues>;
}) {
  return (
    <FormContext.Provider
      value={formMethods as UseFormReturn<Record<string, unknown>>}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>() {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }

  return context as UseFormReturn<TFormValues>;
}
