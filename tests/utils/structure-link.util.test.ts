import { describe, expect, it } from "vitest";

import { StructureType } from "@/types/structure.type";
import { getCpomStructureLink } from "@/utils/cpom-structure-link.util";

const buildStructure = (
  overrides: Partial<Parameters<typeof getCpomStructureLink>[0]> = {}
): Parameters<typeof getCpomStructureLink>[0] => ({
  id: 42,
  codeBhasile: "CADA-042",
  type: StructureType.CADA,
  communeAdministrative: "Nancy",
  departementAdministratif: "54",
  operateur: { name: "Opérateur" },
  isFinalised: false,
  isClosed: false,
  isVisible: true,
  ...overrides,
});

const canUpdate = () => true;
const cannotUpdate = () => false;

describe("getCpomStructureLink", () => {
  it("mène à la fiche d'une structure finalisée, même sans droit de modification", () => {
    expect(
      getCpomStructureLink(buildStructure({ isFinalised: true }), cannotUpdate)
        ?.href
    ).toBe("/structures/42");
  });

  it("mène à la fiche d'une structure fermée non finalisée", () => {
    expect(
      getCpomStructureLink(buildStructure({ isClosed: true }), canUpdate)?.href
    ).toBe("/structures/42");
  });

  it("mène à la finalisation d'une structure visible non finalisée quand l'agent peut la modifier", () => {
    expect(getCpomStructureLink(buildStructure(), canUpdate)?.href).toBe(
      "/structures/42/finalisation/01-identification"
    );
  });

  it("ne propose aucun lien vers la finalisation sans droit de modification", () => {
    expect(getCpomStructureLink(buildStructure(), cannotUpdate)).toBeNull();
  });

  it("ne propose aucun lien pour une structure pas encore saisie par l'opérateur", () => {
    expect(
      getCpomStructureLink(buildStructure({ isVisible: false }), canUpdate)
    ).toBeNull();
  });

  it("transmet l'id et le département de rattachement au contrôle de droits", () => {
    const checkedStructures: unknown[] = [];
    getCpomStructureLink(buildStructure(), (structure) => {
      checkedStructures.push(structure);
      return true;
    });
    expect(checkedStructures).toEqual([
      { id: 42, departementAdministratif: "54" },
    ]);
  });
});
