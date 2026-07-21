import { ReactNode } from "react";
import {
  FieldValues,
  FormProvider as HookFormProvider,
  useForm,
} from "react-hook-form";

import { FormProvider } from "@/app/context/FormContext";

type FormTestWrapperProps = {
  children: ReactNode;
  defaultValues?: Record<string, unknown>;
  onSubmit?: (values: FieldValues) => void;
};

export function FormTestWrapper({
  children,
  defaultValues = {},
  onSubmit,
}: FormTestWrapperProps) {
  const methods = useForm({
    defaultValues,
    mode: "onBlur",
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
