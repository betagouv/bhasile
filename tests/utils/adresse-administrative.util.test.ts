import { describe, expect, it } from "vitest";

import { withoutAdresseAdministrativeHorsPerimetre } from "@/utils/adresse-administrative.util";

const isParis = (departementAdministratif: string) =>
  departementAdministratif === "75";

describe("withoutAdresseAdministrativeHorsPerimetre", () => {
  it("garde l'adresse d'un département du périmètre", () => {
    const values = {
      nom: "Les Coquelicots",
      adresseAdministrative: "10 Rue de la Paix",
      departementAdministratif: "75",
    };

    expect(withoutAdresseAdministrativeHorsPerimetre(values, isParis)).toEqual(
      values
    );
  });

  it("retire l'adresse d'un département hors périmètre et garde le reste", () => {
    const result = withoutAdresseAdministrativeHorsPerimetre(
      {
        nom: "Les Coquelicots",
        adresseAdministrativeComplete: "44 Rue de la Paix 10000 Troyes",
        adresseAdministrative: "44 Rue de la Paix",
        codePostalAdministratif: "10000",
        communeAdministrative: "Troyes",
        departementAdministratif: "10",
      },
      isParis
    );

    expect(JSON.parse(JSON.stringify(result))).toEqual({
      nom: "Les Coquelicots",
    });
  });
});
