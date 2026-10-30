import { describe, expect, it } from "vitest";

import { StructureType } from "@/types/structure.type";
import {
  getCpomStructureLink,
  getStructureHref,
  hasStructureFiche,
} from "@/utils/structure-link.util";

describe("hasStructureFiche", () => {
  it("ouvre la fiche d'une structure finalisée", () => {
    expect(hasStructureFiche({ isFinalised: true })).toBe(true);
  });

  it("ouvre la fiche d'une structure fermée même non finalisée", () => {
    expect(hasStructureFiche({ isFinalised: false, isClosed: true })).toBe(
      true
    );
  });

  it("n'ouvre pas la fiche d'une structure ouverte non finalisée", () => {
    expect(hasStructureFiche({ isFinalised: false })).toBe(false);
  });
});

describe("getStructureHref", () => {
  it("pointe vers la fiche d'une structure finalisée", () => {
    expect(getStructureHref({ id: 42, isFinalised: true })).toBe(
      "/structures/42"
    );
  });

  it("pointe vers la finalisation d'une structure non finalisée", () => {
    expect(getStructureHref({ id: 42, isFinalised: false })).toBe(
      "/structures/42/finalisation/01-identification"
    );
  });
});

const buildStructure = (
  overrides: Partial<Parameters<typeof getCpomStructureLink>[0]> = {}
): Parameters<typeof getCpomStructureLink>[0] => ({
  id: 42,
  codeBhasile: "CADA-042",
  type: StructureType.CADA,
  communeAdministrative: "Nancy",
  departementAdministratif: "54",
  operateur: { id: 7, name: "Opérateur" },
  isFinalised: false,
  isClosed: false,
  isVisible: true,
  ...overrides,
});

const allowed = () => true;
const denied = () => false;

describe("getCpomStructureLink", () => {
  it("mène à la fiche d'une structure finalisée lisible, même sans droit de modification", () => {
    expect(
      getCpomStructureLink(buildStructure({ isFinalised: true }), {
        canReadStructure: allowed,
        canUpdateStructure: denied,
      })
    ).toMatchObject({ href: "/structures/42", isFinalisation: false });
  });

  it("ne propose aucun lien vers la fiche d'une structure hors du périmètre de lecture", () => {
    expect(
      getCpomStructureLink(buildStructure({ isFinalised: true }), {
        canReadStructure: denied,
        canUpdateStructure: allowed,
      })
    ).toBeNull();
  });

  it("mène à la fiche d'une structure fermée non finalisée", () => {
    expect(
      getCpomStructureLink(buildStructure({ isClosed: true }), {
        canReadStructure: allowed,
        canUpdateStructure: allowed,
      })?.href
    ).toBe("/structures/42");
  });

  it("mène à la finalisation d'une structure visible non finalisée quand l'agent peut la modifier", () => {
    expect(
      getCpomStructureLink(buildStructure(), {
        canReadStructure: allowed,
        canUpdateStructure: allowed,
      })
    ).toMatchObject({
      href: "/structures/42/finalisation/01-identification",
      isFinalisation: true,
    });
  });

  it("ne propose aucun lien vers la finalisation sans droit de modification", () => {
    expect(
      getCpomStructureLink(buildStructure(), {
        canReadStructure: allowed,
        canUpdateStructure: denied,
      })
    ).toBeNull();
  });

  it("ne propose aucun lien pour une structure pas encore saisie par l'opérateur", () => {
    expect(
      getCpomStructureLink(buildStructure({ isVisible: false }), {
        canReadStructure: allowed,
        canUpdateStructure: allowed,
      })
    ).toBeNull();
  });

  it("transmet l'id, le département de rattachement et l'opérateur au contrôle de droits", () => {
    const checkedStructures: unknown[] = [];
    getCpomStructureLink(buildStructure({ isFinalised: true }), {
      canReadStructure: (structure) => {
        checkedStructures.push(structure);
        return true;
      },
      canUpdateStructure: allowed,
    });
    expect(checkedStructures).toEqual([
      { id: 42, departementAdministratif: "54", operateurId: 7 },
    ]);
  });
});
