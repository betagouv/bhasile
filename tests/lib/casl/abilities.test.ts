import { describe, expect, it } from "vitest";

import type { FileWithParents } from "@/app/api/files/file.db.type";
// eslint-disable-next-line no-restricted-imports
import { Structure } from "@/generated/prisma/client";
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
  } as Structure;

  const structure13 = {
    id: 2,
    departementAdministratif: "13",
  } as Structure;

  const structure69 = {
    id: 3,
    departementAdministratif: "69",
  } as Structure;

  it("autorise un agent NATIONAL à modifier une structure si son département est dans allowedDepartements", () => {
    const user = {
      id: "user1",
      role: "NATIONAL",
      allowedDepartements: [...Array(96).keys()].map((num) => num.toString()),
    } as SessionUser;

    expect(canUpdateStructure(user, structure69)).toBe(true);
  });

  it("autorise un agent DEPARTEMENT à modifier une structure si son département est dans allowedDepartements", () => {
    const user = {
      id: "user2",
      role: "DEPARTEMENT_AIN",
      allowedDepartements: ["1"],
    } as SessionUser;

    expect(canUpdateStructure(user, structure1)).toBe(true);
  });

  it("refuse à un agent DEPARTEMENT de modifier une structure si son département n'est pas dans allowedDepartements", () => {
    const user = {
      id: "user3",
      role: "DEPARTEMENT_RHONE",
      allowedDepartements: ["69"],
    } as SessionUser;

    expect(canUpdateStructure(user, structure13)).toBe(false);
  });

  it("autorise un agent REGION à modifier une structure si son département est dans allowedDepartements", () => {
    const user = {
      id: "user4",
      role: "REGION_PAC",
      allowedDepartements: ["04", "05", "06", "13", "83", "84"],
    } as SessionUser;

    expect(canUpdateStructure(user, structure13)).toBe(true);
  });

  it("refuse à un agent ANONYMOUS de modifier une structure", () => {
    const user = {
      id: "user5",
      role: "ANONYMOUS",
      allowedDepartements: [],
    } as unknown as SessionUser;

    expect(canUpdateStructure(user, structure69)).toBe(false);
  });

  it("refuse à un utilisateur déconnecté de modifier une structure", () => {
    expect(
      canUpdateStructure(undefined as unknown as SessionUser, structure69)
    ).toBe(false);
  });
});

describe("Permissions : canUpdateDepartement", () => {
  const nationalUser = {
    id: "national",
    role: "NATIONAL",
    allowedDepartements: [] as string[],
  } as SessionUser;

  const departementUser = {
    id: "departement",
    role: "DEPARTEMENT_MANCHE",
    allowedDepartements: ["50"],
  } as SessionUser;

  it("autorise un agent NATIONAL sur n'importe quel département, y compris un département undefined", () => {
    expect(canUpdateDepartement(nationalUser, "50")).toBe(true);
    expect(canUpdateDepartement(nationalUser, "13")).toBe(true);
    expect(canUpdateDepartement(nationalUser, undefined)).toBe(true);
  });

  it("autorise un agent DEPARTEMENT uniquement sur son propre département", () => {
    expect(canUpdateDepartement(departementUser, "50")).toBe(true);
    expect(canUpdateDepartement(departementUser, "13")).toBe(false);
  });

  it("masque les transformations sans département à un agent DEPARTEMENT", () => {
    expect(canUpdateDepartement(departementUser, undefined)).toBe(false);
    expect(canUpdateDepartement(departementUser, null)).toBe(false);
  });
});

describe("Permissions : canDeleteFile", () => {
  const nationalUser = {
    id: "national",
    role: "NATIONAL",
    allowedDepartements: [] as string[],
  } as SessionUser;

  const dep75User = {
    id: "dep75",
    role: "DEPARTEMENT_PARIS",
    allowedDepartements: ["75"],
  } as SessionUser;

  const dep92User = {
    id: "dep92",
    role: "DEPARTEMENT_HAUTS_DE_SEINE",
    allowedDepartements: ["92"],
  } as SessionUser;

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
