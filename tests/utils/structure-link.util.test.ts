import { describe, expect, it } from "vitest";

import { StructureType } from "@/types/structure.type";
import {
  getCpomStructureAction,
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
  overrides: Partial<Parameters<typeof getCpomStructureAction>[0]> = {}
): Parameters<typeof getCpomStructureAction>[0] => ({
  id: 42,
  codeBhasile: "CADA-042",
  type: StructureType.CADA,
  communeAdministrative: "Nancy",
  departementAdministratif: "54",
  operateur: { name: "Opérateur" },
  isFinalised: false,
  isClosed: false,
  isVisible: true,
  canRead: true,
  canUpdate: true,
  ...overrides,
});

describe("getCpomStructureAction", () => {
  it("mène à la fiche d'une structure finalisée lisible, même sans droit de modification", () => {
    expect(
      getCpomStructureAction(
        buildStructure({ isFinalised: true, canUpdate: false })
      )
    ).toMatchObject({ kind: "fiche", href: "/structures/42" });
  });

  it("ne propose aucun lien vers la fiche d'une structure hors du périmètre de lecture", () => {
    expect(
      getCpomStructureAction(
        buildStructure({ isFinalised: true, canRead: false })
      )
    ).toBeNull();
  });

  it("mène à la fiche d'une structure fermée non finalisée", () => {
    expect(
      getCpomStructureAction(buildStructure({ isClosed: true }))
    ).toMatchObject({ kind: "fiche", href: "/structures/42" });
  });

  it("mène à la finalisation d'une structure visible non finalisée quand l'agent peut la modifier", () => {
    expect(getCpomStructureAction(buildStructure())).toMatchObject({
      kind: "finalisation",
      href: "/structures/42/finalisation/01-identification",
    });
  });

  it("signale le manque de droits sur une structure visible non finalisée sans droit de modification", () => {
    expect(
      getCpomStructureAction(buildStructure({ canUpdate: false }))
    ).toEqual({
      kind: "finalisationForbidden",
      title: "Finaliser la création de la structure CADA-042",
    });
  });

  it("ne propose aucun lien pour une structure pas encore saisie par l'opérateur", () => {
    expect(
      getCpomStructureAction(buildStructure({ isVisible: false }))
    ).toBeNull();
  });
});
