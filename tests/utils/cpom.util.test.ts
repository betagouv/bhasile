import { describe, expect, it } from "vitest";

import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { CpomApiRead } from "@/schemas/api/cpom.schema";

const makeCpom = (actesAdministratifs: unknown[]): CpomApiRead =>
  ({ id: 1, actesAdministratifs }) as unknown as CpomApiRead;

describe("getCpomDefaultValues", () => {
  it("ajoute la ligne de contrat quand le CPOM ne porte aucun acte", () => {
    const { actesAdministratifs } = getCpomDefaultValues(makeCpom([]));

    expect(actesAdministratifs).toHaveLength(1);
    expect(actesAdministratifs?.[0]?.category).toBe("CONVENTION_CPOM");
  });

  it("ajoute la ligne de contrat quand le CPOM ne porte que des actes scopés par type", () => {
    const { actesAdministratifs } = getCpomDefaultValues(
      makeCpom([
        {
          id: 10,
          category: "ARRETE_AUTORISATION",
          structureType: "CADA",
          parentId: null,
        },
      ])
    );

    expect(actesAdministratifs).toHaveLength(2);
    expect(
      actesAdministratifs?.some(
        (acteAdministratif) => acteAdministratif.category === "CONVENTION_CPOM"
      )
    ).toBe(true);
    expect(
      actesAdministratifs?.some(
        (acteAdministratif) =>
          acteAdministratif.category === "ARRETE_AUTORISATION"
      )
    ).toBe(true);
  });

  it("n'ajoute pas de ligne de contrat quand le contrat existe déjà", () => {
    const { actesAdministratifs } = getCpomDefaultValues(
      makeCpom([{ id: 5, category: "CONVENTION_CPOM", parentId: null }])
    );

    expect(actesAdministratifs).toHaveLength(1);
    expect(actesAdministratifs?.[0]?.id).toBe(5);
  });

  it("ajoute la ligne de contrat quand seul un avenant de contrat existe", () => {
    const { actesAdministratifs } = getCpomDefaultValues(
      makeCpom([{ id: 6, category: "CONVENTION_CPOM", parentId: 5 }])
    );

    expect(actesAdministratifs).toHaveLength(2);
  });
});
