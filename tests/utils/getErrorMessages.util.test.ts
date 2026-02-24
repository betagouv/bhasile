import { FieldErrors } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { getErrorMessages } from "@/app/utils/getErrorMessages.util";

describe("getErrorMessages", () => {
  it("collects messages from nested form error structure (e.g. form with user.name, user.email)", () => {
    const formState = {
      errors: {
        user: {
          name: { message: "Le nom est requis" },
          email: {
            message: "Email invalide",
            types: { format: "Format email incorrect" },
          },
        },
      },
    } as unknown as { errors: FieldErrors };

    expect(getErrorMessages(formState)).toEqual([
      "Le nom est requis",
      "Email invalide",
      "Format email incorrect",
    ]);
  });

  it("extracts messages from error.types with both string and array values", () => {
    const formState = {
      errors: {
        password: {
          message: "Champ requis",
          types: {
            required: "Le mot de passe est obligatoire",
            minLength: ["Trop court", "Au moins 8 caractères"],
            // non-string values are filtered out
            custom: [42, "Doit contenir un chiffre"],
          },
        },
      },
    } as unknown as { errors: FieldErrors };

    expect(getErrorMessages(formState)).toEqual([
      "Champ requis",
      "Le mot de passe est obligatoire",
      "Trop court",
      "Au moins 8 caractères",
      "Doit contenir un chiffre",
    ]);
  });

  it("filters to a specific field when fieldPath is provided", () => {
    const formState = {
      errors: {
        user: {
          name: { message: "Nom requis" },
          email: { message: "Email requis" },
        },
        address: {
          city: { message: "Ville requise" },
        },
      },
    } as unknown as { errors: FieldErrors };

    expect(getErrorMessages(formState, "user")).toEqual([
      "Nom requis",
      "Email requis",
    ]);
    expect(getErrorMessages(formState, "address")).toEqual(["Ville requise"]);
  });
});
