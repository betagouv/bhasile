import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { useFieldValidator } from "@/app/hooks/useFieldValidator";

describe("useFieldValidator", () => {
  // Create a test schema with French error messages
  const testSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("L'email est invalide"),
    age: z.number().min(18, "Doit avoir au moins 18 ans"),
  });

  it("retourne undefined pour des valeurs de champ valides", () => {
    // GIVEN
    const { result } = renderHook(() => useFieldValidator(testSchema));

    // WHEN
    const nameErrors = result.current.validateField("name", "John");
    const emailErrors = result.current.validateField(
      "email",
      "john@example.com"
    );
    const ageErrors = result.current.validateField("age", 25);

    // THEN
    expect(nameErrors).toBeUndefined();
    expect(emailErrors).toBeUndefined();
    expect(ageErrors).toBeUndefined();
  });

  it("retourne les messages d'erreur pour des valeurs de champ invalides", () => {
    // GIVEN
    const { result } = renderHook(() => useFieldValidator(testSchema));

    // WHEN
    const nameErrors = result.current.validateField("name", "J");
    const emailErrors = result.current.validateField("email", "not-an-email");
    const ageErrors = result.current.validateField("age", 16);

    // THEN
    expect(nameErrors).toEqual(["Le nom doit contenir au moins 2 caractères"]);
    expect(emailErrors).toEqual(["L'email est invalide"]);
    expect(ageErrors).toEqual(["Doit avoir au moins 18 ans"]);
  });

  it("gère les valeurs undefined", () => {
    // GIVEN
    const { result } = renderHook(() => useFieldValidator(testSchema));

    // WHEN
    const nameErrors = result.current.validateField("name", undefined);
    const emailErrors = result.current.validateField("email", undefined);

    // THEN
    expect(nameErrors).toBeDefined();
    expect(emailErrors).toBeDefined();
  });

  it("gère les champs inexistants", () => {
    // GIVEN
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const { result } = renderHook(() => useFieldValidator(testSchema));

    // WHEN
    const errors = result.current.validateField(
      "nonExistentField",
      "some value"
    );

    // THEN
    expect(errors).toBeUndefined();
    expect(console.error).toHaveBeenCalled();

    // Restore console.error
    console.error = originalConsoleError;
  });

  it("valide correctement différents types", () => {
    // GIVEN
    const { result } = renderHook(() => useFieldValidator(testSchema));

    // WHEN
    const nameErrors = result.current.validateField("name", 123);
    const ageErrors = result.current.validateField("age", "twenty");

    // THEN
    expect(nameErrors).toBeDefined();
    expect(ageErrors).toBeDefined();
  });

  it("gère des scénarios de validation complexes", () => {
    // GIVEN
    const complexSchema = z.object({
      password: z
        .string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .regex(
          /[A-Z]/,
          "Le mot de passe doit contenir au moins une lettre majuscule"
        )
        .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
    });

    const { result } = renderHook(() => useFieldValidator(complexSchema));

    // WHEN
    const validPasswordErrors = result.current.validateField(
      "password",
      "Password123"
    );
    const shortPasswordErrors = result.current.validateField(
      "password",
      "Pass1"
    );
    const noUppercaseErrors = result.current.validateField(
      "password",
      "password123"
    );
    const noNumberErrors = result.current.validateField(
      "password",
      "PasswordABC"
    );

    // THEN
    expect(validPasswordErrors).toBeUndefined();
    expect(shortPasswordErrors).toEqual([
      "Le mot de passe doit contenir au moins 8 caractères",
    ]);
    expect(noUppercaseErrors).toEqual([
      "Le mot de passe doit contenir au moins une lettre majuscule",
    ]);
    expect(noNumberErrors).toEqual([
      "Le mot de passe doit contenir au moins un chiffre",
    ]);
  });
});
