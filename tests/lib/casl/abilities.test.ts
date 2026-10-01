import {
  createDepartementalAgent,
  createNationalAgent,
  createSessionGrant,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { describe, expect, it } from "vitest";

import type { FileWithParents } from "@/app/api/files/file.db.type";
import { AccessRole, Structure } from "@/generated/prisma/client";
import {
  canDeleteFile,
  canUpdateDepartement,
  canUpdateStructure,
} from "@/lib/casl/abilities";
import { SessionUser } from "@/types/global";

describe("Permissions : canUpdateStructure", () => {
  const structure1 = {
    id: 1,
    departementAdministratif: "1",
    operateurId: 10,
  } as Structure;

  const structure13 = {
    id: 2,
    departementAdministratif: "13",
    operateurId: 20,
  } as Structure;

  const structure69 = {
    id: 3,
    departementAdministratif: "69",
    operateurId: 10,
  } as Structure;

  it("autorise un agent éditeur national à modifier n'importe quelle structure", () => {
    expect(canUpdateStructure(createNationalAgent(), structure69)).toBe(true);
  });

  it("autorise un agent éditeur à modifier une structure de son département", () => {
    expect(
      canUpdateStructure(createDepartementalAgent(["1"]), structure1)
    ).toBe(true);
  });

  it("refuse à un agent de modifier une structure hors de son département malgré son accès viewer national", () => {
    expect(
      canUpdateStructure(createDepartementalAgent(["69"]), structure13)
    ).toBe(false);
  });

  it("refuse à un agent uniquement viewer de modifier une structure", () => {
    const user = createSessionUser({
      grants: [
        createSessionGrant({ role: AccessRole.VIEWER, isNational: true }),
      ],
    });

    expect(canUpdateStructure(user, structure69)).toBe(false);
  });

  it("autorise un agent admin à modifier une structure de son périmètre", () => {
    const user = createSessionUser({
      grants: [
        createSessionGrant({
          role: AccessRole.ADMIN,
          departementNumeros: ["13"],
        }),
      ],
    });

    expect(canUpdateStructure(user, structure13)).toBe(true);
  });

  it("cumule les binômes de plusieurs niveaux", () => {
    const user = createSessionUser({
      grants: [
        createSessionGrant({ departementNumeros: ["1"] }),
        createSessionGrant({ structureIds: [2] }),
      ],
    });

    expect(canUpdateStructure(user, structure1)).toBe(true);
    expect(canUpdateStructure(user, structure13)).toBe(true);
    expect(canUpdateStructure(user, structure69)).toBe(false);
  });

  it("n'accorde rien à un binôme sans cible", () => {
    const user = createSessionUser({ grants: [createSessionGrant()] });

    expect(canUpdateStructure(user, structure1)).toBe(false);
  });

  it("n'accorde aucune écriture à un utilisateur opérateur", () => {
    const user = createSessionUser({
      operateurId: 10,
      grants: [createSessionGrant({ isNational: true })],
    });

    expect(canUpdateStructure(user, structure1)).toBe(false);
  });

  it("autorise un superadmin sans binôme à tout modifier", () => {
    const user = createSessionUser({ isSuperAdmin: true });

    expect(canUpdateStructure(user, structure13)).toBe(true);
  });

  it("refuse à un agent sans binôme de modifier une structure", () => {
    expect(canUpdateStructure(createSessionUser(), structure69)).toBe(false);
  });

  it("refuse à un utilisateur déconnecté de modifier une structure", () => {
    expect(
      canUpdateStructure(undefined as unknown as SessionUser, structure69)
    ).toBe(false);
  });
});

describe("Permissions : canUpdateDepartement", () => {
  const nationalUser = createNationalAgent();

  const departementUser = createDepartementalAgent(["50"]);

  it("autorise un agent éditeur national sur n'importe quel département, y compris un département undefined", () => {
    expect(canUpdateDepartement(nationalUser, "50")).toBe(true);
    expect(canUpdateDepartement(nationalUser, "13")).toBe(true);
    expect(canUpdateDepartement(nationalUser, undefined)).toBe(true);
  });

  it("autorise un agent départemental uniquement sur son propre département", () => {
    expect(canUpdateDepartement(departementUser, "50")).toBe(true);
    expect(canUpdateDepartement(departementUser, "13")).toBe(false);
  });

  it("masque les transformations sans département à un agent départemental", () => {
    expect(canUpdateDepartement(departementUser, undefined)).toBe(false);
    expect(canUpdateDepartement(departementUser, null)).toBe(false);
  });
});

describe("Permissions : canDeleteFile", () => {
  const nationalUser = createNationalAgent();

  const dep75User = createDepartementalAgent(["75"]);

  const dep92User = createDepartementalAgent(["92"]);

  const buildFile = (overrides: Partial<FileWithParents>): FileWithParents =>
    ({
      acteAdministratifId: null,
      documentFinancierId: null,
      controleId: null,
      evaluationId: null,
      operateurId: null,
      acteAdministratif: null,
      documentFinancier: null,
      controle: null,
      evaluation: null,
      operateur: null,
      ...overrides,
    }) as unknown as FileWithParents;

  it("autorise n'importe quel agent à supprimer un fichier d'une transformation en cours (acte lié à une structureVersionTransformation)", () => {
    const file = buildFile({
      acteAdministratifId: 1,
      acteAdministratif: {
        structureVersionTransformationId: 7,
        structureId: null,
        cpom: null,
        operateur: null,
        structure: null,
      } as unknown as FileWithParents["acteAdministratif"],
    });

    expect(canDeleteFile(dep92User, file)).toBe(true);
  });

  it("cloisonne par département la suppression d'un fichier d'acte lié à une structure", () => {
    const file = buildFile({
      acteAdministratifId: 1,
      acteAdministratif: {
        structureVersionTransformationId: null,
        structureId: 10,
        cpom: null,
        operateur: null,
        structure: { departementAdministratif: "75" },
      } as unknown as FileWithParents["acteAdministratif"],
    });

    expect(canDeleteFile(dep75User, file)).toBe(true);
    expect(canDeleteFile(dep92User, file)).toBe(false);
  });

  it("autorise tout agent à supprimer un fichier d'acte lié à un CPOM (non scopé par département)", () => {
    const file = buildFile({
      acteAdministratifId: 1,
      acteAdministratif: {
        structureVersionTransformationId: null,
        structureId: null,
        cpom: { id: 3 },
        operateur: null,
        structure: null,
      } as unknown as FileWithParents["acteAdministratif"],
    });

    expect(canDeleteFile(dep92User, file)).toBe(true);
  });

  it("cloisonne par département la suppression d'un document financier", () => {
    const file = buildFile({
      documentFinancierId: 5,
      documentFinancier: {
        structure: { departementAdministratif: "92" },
      } as unknown as FileWithParents["documentFinancier"],
    });

    expect(canDeleteFile(dep92User, file)).toBe(true);
    expect(canDeleteFile(dep75User, file)).toBe(false);
  });

  it("cloisonne par département la suppression d'un fichier de contrôle", () => {
    const file = buildFile({
      controleId: 8,
      controle: {
        structure: { departementAdministratif: "75" },
      } as unknown as FileWithParents["controle"],
    });

    expect(canDeleteFile(dep75User, file)).toBe(true);
    expect(canDeleteFile(dep92User, file)).toBe(false);
  });

  it("autorise tout agent à supprimer un logo d'opérateur (non scopé par département)", () => {
    const file = buildFile({
      operateurId: 4,
      operateur: { id: 4 } as unknown as FileWithParents["operateur"],
    });

    expect(canDeleteFile(dep92User, file)).toBe(true);
  });

  it("refuse à un agent départemental un fichier dont la structure parente est introuvable, mais autorise un agent NATIONAL", () => {
    const file = buildFile({
      documentFinancierId: 5,
      documentFinancier: {
        structure: null,
      } as unknown as FileWithParents["documentFinancier"],
    });

    expect(canDeleteFile(dep75User, file)).toBe(false);
    expect(canDeleteFile(nationalUser, file)).toBe(true);
  });

  it("refuse par défaut la suppression d'un fichier d'acte rattaché à aucune entité résolvable", () => {
    const file = buildFile({
      acteAdministratifId: 1,
      acteAdministratif: {
        structureVersionTransformationId: null,
        structureId: null,
        cpom: null,
        operateur: null,
        structure: null,
      } as unknown as FileWithParents["acteAdministratif"],
    });

    expect(canDeleteFile(nationalUser, file)).toBe(false);
  });
});
