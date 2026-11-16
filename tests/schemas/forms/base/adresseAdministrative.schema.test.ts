import { describe, expect, it } from "vitest";

import {
  adresseAdministrativeAutoSaveSchema,
  withDepartementAdministratifInPerimetre,
} from "@/schemas/forms/base/adresseAdministrative.schema";

const schema = withDepartementAdministratifInPerimetre(
  adresseAdministrativeAutoSaveSchema,
  (departementAdministratif) => departementAdministratif === "75"
);

describe("withDepartementAdministratifInPerimetre", () => {
  it("accepte un département du périmètre", () => {
    const result = schema.safeParse({ departementAdministratif: "75" });

    expect(result.success).toBe(true);
  });

  it("accepte une adresse sans département", () => {
    const result = schema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("rejette un département hors périmètre sur le champ adresse", () => {
    const result = schema.safeParse({ departementAdministratif: "10" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      message: "Le département 10 n’est pas dans votre périmètre.",
      path: ["adresseAdministrativeComplete"],
    });
  });

  it("laisse le schéma d'origine inchangé", () => {
    const result = adresseAdministrativeAutoSaveSchema.safeParse({
      departementAdministratif: "10",
    });

    expect(result.success).toBe(true);
  });
});
