import { describe, expect, it } from "vitest";

import {
  adresseAdministrativeAutoSaveSchema,
  adresseAdministrativeSchema,
  withDepartementAdministratifInPerimetre,
} from "@/schemas/forms/base/adresseAdministrative.schema";

const isDepartement75 = (departementAdministratif: string) =>
  departementAdministratif === "75";

const perimetreIssue = {
  message: "Le département 10 n’est pas dans votre périmètre.",
  path: ["adresseAdministrativeComplete"],
};

describe("withDepartementAdministratifInPerimetre", () => {
  it("accepte un département du périmètre", () => {
    const schema = withDepartementAdministratifInPerimetre(
      adresseAdministrativeAutoSaveSchema,
      isDepartement75
    );

    expect(schema.safeParse({ departementAdministratif: "75" }).success).toBe(
      true
    );
  });

  it("signale un département hors périmètre sur le champ adresse, même quand d'autres champs sont en erreur", () => {
    const schema = withDepartementAdministratifInPerimetre(
      adresseAdministrativeSchema,
      isDepartement75
    );

    expect(
      schema.safeParse({ departementAdministratif: "10" }).error?.issues
    ).toContainEqual(expect.objectContaining(perimetreIssue));
  });
});
