import { useFormContext } from "react-hook-form";

/**
 * Custom hook to access form methods from FormWrapper context
 * This allows components to access form methods without using render props
 */
export function useForm() {
  const methods = useFormContext();

  if (!methods) {
    throw new Error("useForm must be used within a FormWrapper component");
  }

  return methods;
}
