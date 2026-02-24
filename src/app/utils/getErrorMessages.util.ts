import { FieldError, FieldErrors } from "react-hook-form";

const extractMessagesFromError = (error: FieldError): string[] => {
  const messages: string[] = [];

  if (typeof error.message === "string") {
    messages.push(error.message);
  }

  if (error.types && typeof error.types === "object") {
    for (const value of Object.values(error.types)) {
      if (typeof value === "string") {
        messages.push(value);
      } else if (Array.isArray(value)) {
        messages.push(
          ...value.filter((v): v is string => typeof v === "string")
        );
      }
    }
  }

  return messages;
};

const isFieldError = (value: unknown): value is FieldError => {
  return (
    typeof value === "object" &&
    value !== null &&
    ("message" in value || "types" in value)
  );
};

const collectMessages = (errors: unknown): string[] => {
  const messages: string[] = [];

  function traverse(obj: unknown): void {
    if (isFieldError(obj)) {
      messages.push(...extractMessagesFromError(obj));
      return;
    }
    if (obj && typeof obj === "object") {
      for (const value of Object.values(obj)) {
        traverse(value);
      }
    }
  }

  traverse(errors);
  return messages;
};

export const getErrorMessages = (
  formState: { errors: FieldErrors },
  fieldPath?: string
): string[] => {
  const errorsObject = formState.errors as Record<string, unknown>;
  const errors = fieldPath ? errorsObject[fieldPath] : errorsObject;

  return collectMessages(errors);
};
