import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode } from "react";
import {
  FieldValues,
  FormProvider as HookFormProvider,
  Resolver,
  useForm,
} from "react-hook-form";

import { FormProvider } from "@/contexts/FormContext";
import { AnyZodSchema } from "@/types/form.type";

type FormTestWrapperProps = {
  children: ReactNode;
  defaultValues?: Record<string, unknown>;
  onSubmit?: (values: FieldValues) => void;
  schema?: AnyZodSchema;
};

export function FormTestWrapper({
  children,
  defaultValues = {},
  onSubmit,
  schema,
}: FormTestWrapperProps) {
  const methods = useForm({
    defaultValues,
    mode: "onBlur",
    resolver: schema ? (zodResolver(schema) as Resolver) : undefined,
  });

  return (
    <HookFormProvider {...methods}>
      <FormProvider formMethods={methods}>
        {children}
        {onSubmit && (
          <button type="button" onClick={methods.handleSubmit(onSubmit)}>
            Valider
          </button>
        )}
      </FormProvider>
    </HookFormProvider>
  );
}
