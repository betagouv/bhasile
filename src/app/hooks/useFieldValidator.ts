import { z } from "zod";

type ZodObjectShape = Record<string, z.ZodType>;

export function useFieldValidator<T extends z.ZodObject<ZodObjectShape>>(
  schema: T
) {
  const validateField = (
    fieldName: string,
    value: unknown
  ): string[] | undefined => {
    const fieldSchema = schema.shape[fieldName as keyof typeof schema.shape];

    if (!fieldSchema) {
      console.error(`Field ${fieldName} not found in schema`);
      return;
    }

    const result = fieldSchema.safeParse(value);

    if (!result.success) {
      return result.error.issues.map((issue: z.ZodIssue) => issue.message);
    }
    return;
  };

  return { validateField };
}
