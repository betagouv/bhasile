import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { useDebounceCallback } from "@/app/hooks/useDebounceCallback";

const DEBOUNCE_TIME = 500;

export const AutoSave = <TSchema extends z.ZodTypeAny>({
  schema,
  onSave,
}: {
  schema: TSchema;
  onSave: (data: z.infer<TSchema>) => Promise<void>;
}) => {
  const { watch, getValues } = useFormContext<z.infer<TSchema>>();

  const debouncedSave = useDebounceCallback(async () => {
    const allValues = getValues();

    const result = schema.safeParse(allValues);

    if (result.success) {
      await onSave(result.data);
    } else {
      console.error("AutoSave: données partielles", result.error);
    }
  }, DEBOUNCE_TIME);

  useEffect(() => {
    const subscription = watch(() => {
      debouncedSave();
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSave]);

  return null;
};
