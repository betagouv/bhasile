import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { useOptionalTransformationContext } from "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";

export const TransformationFormController = <TSchema extends z.ZodTypeAny>({
  schema,
  onSave,
}: {
  schema: TSchema;
  onSave: (data: z.infer<TSchema>, values: z.infer<TSchema>) => Promise<void>;
}) => {
  const {
    getValues,
    trigger,
    formState: { isDirty },
  } = useFormContext<z.infer<TSchema>>();
  const { registerSaver, shouldShowIncompleteSteps } =
    useOptionalTransformationContext();

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    const saveCurrentForm = async () => {
      const result = schema.safeParse(getValues());
      if (!result.success) {
        console.error(
          "TransformationFormController: données invalides",
          result.error
        );
        trigger();
        return false;
      }
      await onSaveRef.current(result.data, getValues());
      return true;
    };

    registerSaver(saveCurrentForm);

    return () => registerSaver(null);
  }, [registerSaver, schema, getValues, trigger]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (shouldShowIncompleteSteps) {
      trigger();
    }
  }, [shouldShowIncompleteSteps, trigger]);

  return null;
};
