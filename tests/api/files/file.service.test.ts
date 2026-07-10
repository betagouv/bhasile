import { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FileWithParents } from "@/app/api/files/file.db.type";
import {
  authorizeFileAccess,
  getPrincipal,
} from "@/app/api/files/file.service";
import { SessionUser } from "@/types/global";
import { Principal } from "@/types/principal.type";

const mockCanDeleteFile = vi.fn();

vi.mock("@/lib/casl/abilities", () => ({
  canDeleteFile: (...args: unknown[]) => mockCanDeleteFile(...args),
}));

vi.mock("@/lib/minio", () => ({
  checkBucket: vi.fn(),
  minioClient: {},
}));

vi.mock("@/app/api/files/file.repository", () => ({
  createOne: vi.fn(),
  deleteOneByKey: vi.fn(),
  findOneByKeyWithParents: vi.fn(),
}));

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

const orphanFile = buildFile({});
const linkedFile = buildFile({ documentFinancierId: 1 });

const agent: Principal = {
  type: "agent",
  user: { id: "1", role: "DEPARTEMENT_PARIS" } as SessionUser,
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
});
