import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

import { useOptionalTransformationContext } from "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";

export const SaveCurrentForm = <TSchema extends z.ZodTypeAny>({
  schema,
  onSave,
}: {
  schema: TSchema;
  onSave: (data: z.infer<TSchema>) => Promise<void>;
}) => {
  const { getValues } = useFormContext<z.infer<TSchema>>();
  const { registerSaver } = useOptionalTransformationContext();

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    const saveCurrentForm = async () => {
      const result = schema.safeParse(getValues());
      if (!result.success) {
        console.error("SaveCurrentForm: données invalides", result.error);
        return false;
      }
      await onSaveRef.current(result.data);
      return true;
    };

    registerSaver(saveCurrentForm);

    return () => registerSaver(null);
  }, [registerSaver, schema, getValues]);

  return null;
};
