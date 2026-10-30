import { createDepartementalAgent } from "tests/test-utils/factories/session-user.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getTarificationParticipant,
  postTarificationMessage,
} from "@/app/api/tarifications/tarification.service";
import {
  AccessRole,
  AuthorLevel,
  GrantScope,
  Visibility,
} from "@/generated/prisma/enums";

const mockUpsertStructureTarification = vi.fn();
const mockFindStructureScope = vi.fn();
const mockGetUserWithGrantsByEmail = vi.fn();

vi.mock("@/app/api/tarifications/tarification.repository", () => ({
  upsertStructureTarification: (...args: unknown[]) =>
    mockUpsertStructureTarification(...args),
  findStructureTarification: vi.fn(),
  findMessageTarification: vi.fn(),
  findStructureScope: (...args: unknown[]) => mockFindStructureScope(...args),
}));

vi.mock("@/app/api/conversations/conversation.repository", () => ({
  upsertConversation: vi.fn(),
  createMessage: vi.fn(),
  findMessages: vi.fn(),
  findConversationMessageIds: vi.fn(),
  updateMessageTagKey: vi.fn(),
  createMessageReceipts: vi.fn(),
}));

vi.mock("@/app/api/users/user.repository", () => ({
  getUserWithGrantsByEmail: (...args: unknown[]) =>
    mockGetUserWithGrantsByEmail(...args),
}));

vi.mock("@/app/utils/now.util", async () => {
  const actual = await vi.importActual("@/app/utils/now.util");
  return { ...actual, getCurrentYear: () => 2027 };
});

describe("postTarificationMessage", () => {
  const message = {
    structureId: 1,
    year: 2027,
    visibility: Visibility.SHARED,
    author: { id: 1, level: AuthorLevel.DEPARTEMENT },
    text: "Bonjour",
    tagKey: null,
    fileKeys: [],
  };

  beforeEach(() => {
    mockUpsertStructureTarification.mockReset();
  });

  it("n'écrit rien quand l'étiquette est inconnue", async () => {
    await expect(
      postTarificationMessage({ ...message, tagKey: "INCONNUE" })
    ).rejects.toThrow("Étiquette inconnue");

    expect(mockUpsertStructureTarification).not.toHaveBeenCalled();
  });

  it("n'écrit rien quand l'opérateur vise la conversation agents", async () => {
    await expect(
      postTarificationMessage({
        ...message,
        visibility: Visibility.AGENTS,
        author: { id: 1, level: AuthorLevel.OPERATEUR },
      })
    ).rejects.toThrow("réservés aux agents");

    expect(mockUpsertStructureTarification).not.toHaveBeenCalled();
  });
});

describe("getTarificationParticipant", () => {
  const regionalEditorGrant = {
    role: AccessRole.EDITEUR,
    scope: GrantScope.REGION,
    region: { id: 11, name: "Île-de-France", departements: [{ numero: "75" }] },
    departement: null,
    structure: null,
  };
  const buildDatabaseUser = (overrides: object) => ({
    id: 5,
    operateurId: null,
    isSuperAdmin: false,
    isAgent: true,
    grants: [regionalEditorGrant],
    emailPattern: null,
    ...overrides,
  });

  beforeEach(() => {
    mockFindStructureScope.mockResolvedValue({
      id: 1,
      departementAdministratif: "75",
      operateurId: null,
    });
  });

  it("signe au niveau régional un agent éditeur de la région", async () => {
    mockGetUserWithGrantsByEmail.mockResolvedValue(buildDatabaseUser({}));

    const participant = await getTarificationParticipant(
      createDepartementalAgent(["75"]),
      1
    );

    expect(participant).toEqual({
      id: 5,
      level: AuthorLevel.REGION,
    });
  });

  it("retombe au niveau le plus restreint pour un utilisateur qui n'est pas agent en base", async () => {
    mockGetUserWithGrantsByEmail.mockResolvedValue(
      buildDatabaseUser({ isAgent: false })
    );

    const participant = await getTarificationParticipant(
      createDepartementalAgent(["75"]),
      1
    );

    expect(participant.level).toBe(AuthorLevel.OPERATEUR);
  });
});
