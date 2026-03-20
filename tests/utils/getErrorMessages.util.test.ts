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

    expect(getErrorMessages(formState, "user")).toEqual([
      "Le nom est requis",
      "Email invalide",
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
