"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  FieldErrors,
  FormProvider as HookFormProvider,
  useForm,
  UseFormReturn,
  useWatch,
} from "react-hook-form";
import { z } from "zod";

import { FormProvider } from "@/app/context/FormContext";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { cn } from "@/app/utils/classname.util";
import { BHASILE_CONTACT_EMAIL, BHASILE_PHONE_NUMBERS } from "@/constants";
import { DeepPartial } from "@/types/global";

// Define enum for footer buttons
export enum FooterButtonType {
  CANCEL = "cancel",
  SAVE = "save",
  SUBMIT = "submit",
}

export default function FormWrapper<TSchema extends z.ZodTypeAny>({
  schema,
  localStorageKey = "",
  children,
  onSubmit,
  onError,
  mode = "onBlur",
  className,
  defaultValues = {} as DeepPartial<z.infer<TSchema>>,
  onFormChange,
  submitButtonText = "Continuer",
  nextRoute,
  resetRoute,
  showSubmitButton = true,
  previousStep,
  availableFooterButtons = [
    FooterButtonType.CANCEL,
    FooterButtonType.SAVE,
    FooterButtonType.SUBMIT,
  ],
  showAutoSaveMention,
  showContactInfos = true,
}: FormWrapperProps<TSchema>) {
  const router = useRouter();
  const {
    currentValue: localStorageValues,
    updateLocalStorageValue: updateLocalStorageValues,
    resetLocalStorageValues,
  } = useLocalStorage(localStorageKey, {});

  const mergedDefaultValues = {
    ...localStorageValues,
    ...defaultValues,
  } as z.infer<TSchema>;

  const methods = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    mode,
    defaultValues: mergedDefaultValues as z.infer<TSchema>,
    criteriaMode: "all",
    shouldFocusError: true,
  });

  const { handleSubmit, control, reset } = methods;

  const handleReset = () => {
    if (
      window.confirm(
        "Attention : Toutes les données saisies sur cette étape vont être effacées. Êtes-vous sûr·e de vouloir continuer ?"
      )
    ) {
      resetLocalStorageValues();
      reset(defaultValues as z.infer<TSchema>);
      if (resetRoute) {
        router.push(resetRoute);
        window.location.reload();
      }
    }
  };

  const handleFormErrors = (errors: FieldErrors<z.infer<TSchema>>) => {
    console.error("Form validation errors:", errors);
    if (onError) {
      onError(errors);
    }
  };

  const defaultSubmitHandler = (data: z.infer<TSchema>) => {
    console.log("Form submitted successfully with data:", data);
    if (nextRoute) {
      try {
        router.push(nextRoute);
      } catch (error) {
        console.error("Navigation error:", error);
      }
    }
  };

  const formValues = useWatch({ control });

  useEffect(() => {
    if (formValues) {
      updateLocalStorageValues(formValues);
      if (onFormChange) {
        onFormChange(formValues);
      }
    }
  }, [formValues, updateLocalStorageValues, onFormChange]);

  // State for alert
  const [showAlert, setShowAlert] = useState(false);

  const showSavedAlert = () => setShowAlert(true);
  const hideAlert = () => setShowAlert(false);

  return (
    <HookFormProvider {...methods}>
      <FormProvider formMethods={methods}>
        <form
          onSubmit={handleSubmit(
            (data) => (onSubmit || defaultSubmitHandler)(data, methods),
            handleFormErrors
          )}
          className={cn(
            "bg-white p-6 rounded-lg border-default-grey border flex flex-col gap-8",
            className
          )}
        >
          {previousStep && (
            <Link
              href={previousStep}
              className="flex gap-2 fr-link fr-icon  w-fit text-title-blue-france"
            >
              <i className="fr-icon-arrow-left-s-line before:w-4"></i>
              Étape précédente
            </Link>
          )}
          {typeof children === "function" ? children(methods) : children}

          {showSubmitButton && (
            <>
              {showAlert && (
                <Alert
                  className="mb-4"
                  severity="success"
                  title="Enregistré pour plus tard"
                  description="Votre progression a été enregistrée. Les données sont sauvegardées localement dans votre navigateur."
                  closable
                  onClose={hideAlert}
                />
              )}
              <div>
                <div className="flex items-center gap-4 mt-6 justify-end">
                  {showAutoSaveMention && (
                    <div className="flex items-center gap-1 text-mention-grey text-xs">
                      <span className="fr-icon-save-line fr-icon--xs" />
                      Votre progression est enregistrée automatiquement
                    </div>
                  )}
                  {availableFooterButtons.includes(FooterButtonType.CANCEL) && (
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        handleReset();
                      }}
                      priority="secondary"
                    >
                      Annuler
                    </Button>
                  )}
                  {availableFooterButtons.includes(FooterButtonType.SAVE) && (
                    <Button
                      priority="secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        showSavedAlert();
                      }}
                    >
                      Terminer plus tard
                    </Button>
                  )}
                  {availableFooterButtons.includes(FooterButtonType.SUBMIT) && (
                    <Button type="submit">{submitButtonText}</Button>
                  )}
                </div>
                {showContactInfos && (
                  <p className="cta_message text-mention-grey text-sm mt-2 text-right">
                    Si vous ne parvenez pas à remplir certains champs,{" "}
                    <a
                      href={`mailto:${BHASILE_CONTACT_EMAIL}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      contactez-nous par mail
                    </a>
                    ou par téléphone ({BHASILE_PHONE_NUMBERS})
                  </p>
                )}
              </div>
            </>
          )}
        </form>
      </FormProvider>
    </HookFormProvider>
  );
}

type FormWrapperProps<TSchema extends z.ZodTypeAny> = {
  schema: TSchema;
  localStorageKey?: string;
  children: ReactNode | ((form: UseFormReturn<z.infer<TSchema>>) => ReactNode);
  onSubmit?: (
    data: z.infer<TSchema>,
    methods: UseFormReturn<z.infer<TSchema>>
  ) => void | Promise<void>;
  onError?: (errors: FieldErrors<z.infer<TSchema>>) => void;
  mode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
  className?: string;
  defaultValues?: DeepPartial<z.infer<TSchema>>;
  onFormChange?: (values: z.infer<TSchema>) => void;
  submitButtonText?: string;
  nextRoute?: string;
  resetRoute?: string;
  showSubmitButton?: boolean;
  previousStep?: string;
  availableFooterButtons?: Array<FooterButtonType>;
  showAutoSaveMention?: boolean;
  showContactInfos?: boolean;
};
