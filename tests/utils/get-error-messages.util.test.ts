import { FieldErrors } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { getErrorMessages } from "@/app/utils/getErrorMessages.util";

describe("getErrorMessages", () => {
  it("collecte les messages d'une structure d'erreurs de formulaire imbriquée (ex. formulaire avec user.name, user.email)", () => {
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

    expect(getErrorMessages(formState, "user")).toEqual([
      "Le nom est requis",
      "Email invalide",
    ]);
  });

  it("filtre sur un champ spécifique quand fieldPath est fourni", () => {
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
