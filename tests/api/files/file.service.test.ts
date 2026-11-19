import { Session } from "next-auth";
import { createDepartementalAgent } from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FileWithParents } from "@/app/api/files/file.db.type";
import {
  assertFilesCanBeAttachedToEntity,
  authorizeFileAccess,
  getPrincipal,
} from "@/app/api/files/file.service";
import { EntityId } from "@/types/Entity.type";
import { Principal } from "@/types/principal.type";
import { PrismaTransaction } from "@/types/prisma.type";

const mockCanDeleteFile = vi.fn();
const mockCanReadConversation = vi.fn();
const mockFindManyByKeysWithParents = vi.fn();

vi.mock("@/lib/casl", () => ({
  canDeleteFile: (...args: unknown[]) => mockCanDeleteFile(...args),
  canReadConversation: (...args: unknown[]) => mockCanReadConversation(...args),
}));

vi.mock("@/lib/minio", () => ({
  checkBucket: vi.fn(),
  minioClient: {},
}));

vi.mock("@/app/api/files/file.repository", () => ({
  createOne: vi.fn(),
  deleteOneByKey: vi.fn(),
  findManyByKeysWithParents: (...args: unknown[]) =>
    mockFindManyByKeysWithParents(...args),
  findOneByKeyWithParents: vi.fn(),
}));

const buildFile = (overrides: Partial<FileWithParents>): FileWithParents =>
  ({
    acteAdministratifId: null,
    documentFinancierId: null,
    controleId: null,
    evaluationId: null,
    operateurId: null,
    messageId: null,
    acteAdministratif: null,
    documentFinancier: null,
    controle: null,
    evaluation: null,
    operateur: null,
    message: null,
    tarificationDocument: null,
    ...overrides,
  }) as unknown as FileWithParents;

const orphanFile = buildFile({});
const linkedFile = buildFile({ documentFinancierId: 1 });
const messageFile = buildFile({
  messageId: 1,
  message: {
    conversation: {
      visibility: "AGENTS",
      structureTarification: {
        structure: { id: 1, departementAdministratif: "75", operateurId: null },
      },
    },
  },
} as Partial<FileWithParents>);

const tarificationFile = buildFile({
  tarificationDocument: {
    id: 1,
    structureTarification: { structureId: 1, campaign: { year: 2027 } },
  },
});

const agent: Principal = {
  type: "agent",
  user: createDepartementalAgent(["75"]),
};
const operateur: Principal = { type: "operateur" };

describe("getPrincipal", () => {
  it("identifie un agent quand la session contient un utilisateur", () => {
    const session = { user: { id: "1" } } as unknown as Session;

    expect(getPrincipal(session)).toEqual({
      type: "agent",
      user: { id: "1" },
    });
  });

  it("identifie un opérateur en l'absence de session", () => {
    expect(getPrincipal(null)).toEqual({ type: "operateur" });
  });

  it("identifie un opérateur quand la session n'a pas d'utilisateur", () => {
    expect(getPrincipal({} as Session)).toEqual({ type: "operateur" });
  });
});

describe("authorizeFileAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("autorise un opérateur à lire un fichier orphelin", () => {
    expect(authorizeFileAccess(operateur, orphanFile, "read")).toBe(true);
  });

  it("autorise un opérateur à supprimer un fichier orphelin", () => {
    expect(authorizeFileAccess(operateur, orphanFile, "delete")).toBe(true);
  });

  it("autorise un agent à supprimer un fichier orphelin sans consulter CASL", () => {
    expect(authorizeFileAccess(agent, orphanFile, "delete")).toBe(true);
    expect(mockCanDeleteFile).not.toHaveBeenCalled();
  });

  it("refuse à un opérateur la lecture d'un fichier lié", () => {
    expect(authorizeFileAccess(operateur, linkedFile, "read")).toBe(false);
  });

  it("refuse à un opérateur la suppression d'un fichier lié", () => {
    expect(authorizeFileAccess(operateur, linkedFile, "delete")).toBe(false);
  });

  it("autorise un agent à lire un fichier lié sans contrôle de périmètre", () => {
    expect(authorizeFileAccess(agent, linkedFile, "read")).toBe(true);
    expect(mockCanDeleteFile).not.toHaveBeenCalled();
  });

  it("délègue à canDeleteFile la suppression d'un fichier lié par un agent", () => {
    mockCanDeleteFile.mockReturnValueOnce(true);
    expect(authorizeFileAccess(agent, linkedFile, "delete")).toBe(true);
    expect(mockCanDeleteFile).toHaveBeenCalledWith(agent.user, linkedFile);
  });

  it("refuse la suppression d'un fichier lié quand canDeleteFile refuse", () => {
    mockCanDeleteFile.mockReturnValueOnce(false);
    expect(authorizeFileAccess(agent, linkedFile, "delete")).toBe(false);
  });

  it("laisse lire une pièce jointe à qui a accès à sa conversation", () => {
    mockCanReadConversation.mockReturnValue(true);

    expect(authorizeFileAccess(agent, messageFile, "read")).toBe(true);
  });

  it("refuse une pièce jointe à qui n'a pas accès à sa conversation", () => {
    mockCanReadConversation.mockReturnValue(false);

    expect(authorizeFileAccess(agent, messageFile, "read")).toBe(false);
  });

  it("ne laisse jamais supprimer une pièce jointe de message", () => {
    mockCanReadConversation.mockReturnValue(true);
    mockCanDeleteFile.mockReturnValue(true);

    expect(authorizeFileAccess(agent, messageFile, "delete")).toBe(false);
  });

  it("ne traite pas un fichier de tarification comme orphelin et n'en laisse jamais supprimer", () => {
    mockCanDeleteFile.mockReturnValue(true);

    expect(authorizeFileAccess(operateur, tarificationFile, "delete")).toBe(
      false
    );
    expect(authorizeFileAccess(agent, tarificationFile, "delete")).toBe(false);
  });
});

describe("assertFilesCanBeAttachedToEntity", () => {
  const key = "fichier.pdf";
  const tx = {} as PrismaTransaction;
  const structureEntity = { structureId: 1 };

  const assertCanAttach = (
    file: Partial<FileWithParents>,
    entityId: EntityId
  ) => {
    mockFindManyByKeysWithParents.mockResolvedValueOnce([
      buildFile({ key, ...file }),
    ]);
    return assertFilesCanBeAttachedToEntity(tx, [{ key }], entityId);
  };

  const acteOf = (owner: Record<string, number>) =>
    ({
      acteAdministratifId: 10,
      acteAdministratif: owner,
    }) as unknown as Partial<FileWithParents>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each<[string, Partial<FileWithParents>, EntityId]>([
    [
      "l'acte d'une autre structure",
      acteOf({ structureId: 2 }),
      structureEntity,
    ],
    [
      "l'acte d'une structure sur un CPOM",
      acteOf({ structureId: 1 }),
      { cpomId: 3 },
    ],
    [
      "l'acte d'un autre bloc de transformation",
      acteOf({ structureVersionTransformationId: 4 }),
      { structureVersionTransformationId: 5 },
    ],
    [
      "le document financier d'une autre structure",
      {
        documentFinancierId: 10,
        documentFinancier: { structureId: 2 },
      } as Partial<FileWithParents>,
      structureEntity,
    ],
    [
      "le contrôle d'une autre structure",
      {
        controleId: 10,
        controle: { structureId: 2 },
      } as Partial<FileWithParents>,
      structureEntity,
    ],
    [
      "l'évaluation d'une autre structure",
      {
        evaluationId: 10,
        evaluation: { structureId: 2 },
      } as Partial<FileWithParents>,
      structureEntity,
    ],
    ["le logo d'un opérateur", { operateurId: 6 }, structureEntity],
    ["la pièce jointe d'un message", { messageId: 7 }, structureEntity],
    [
      "un fichier rattaché pour une entité vide",
      acteOf({ structureId: 1 }),
      {},
    ],
    [
      "un fichier rattaché pour un identifiant indéfini",
      {
        controleId: 10,
        controle: { structureId: 1 },
      } as Partial<FileWithParents>,
      { cpomId: undefined },
    ],
    [
      "un fichier dont le parent n'a pas été chargé",
      { acteAdministratifId: 10 },
      structureEntity,
    ],
  ])("refuse %s", async (_label, file, entityId) => {
    await expect(assertCanAttach(file, entityId)).rejects.toMatchObject({
      name: "DomainError",
      status: 409,
    });
  });

  it.each<[string, Partial<FileWithParents>, EntityId]>([
    ["un fichier orphelin", {}, structureEntity],
    [
      "l'acte de la même structure",
      acteOf({ structureId: 1 }),
      structureEntity,
    ],
    ["le logo du même opérateur", { operateurId: 6 }, { operateurId: 6 }],
  ])("accepte %s", async (_label, file, entityId) => {
    await expect(assertCanAttach(file, entityId)).resolves.toBeUndefined();
  });

  it("accepte une clé envoyée deux fois", async () => {
    mockFindManyByKeysWithParents.mockResolvedValueOnce([buildFile({ key })]);

    await expect(
      assertFilesCanBeAttachedToEntity(tx, [{ key }, { key }], structureEntity)
    ).resolves.toBeUndefined();
  });

  it("refuse une clé absente de la base avec une erreur 404", async () => {
    mockFindManyByKeysWithParents.mockResolvedValueOnce([]);

    await expect(
      assertFilesCanBeAttachedToEntity(tx, [{ key }], structureEntity)
    ).rejects.toMatchObject({ name: "DomainError", status: 404 });
  });

  it("n'interroge pas la base quand aucun fichier n'est envoyé", async () => {
    await assertFilesCanBeAttachedToEntity(tx, [], structureEntity);

    expect(mockFindManyByKeysWithParents).not.toHaveBeenCalled();
  });
});
