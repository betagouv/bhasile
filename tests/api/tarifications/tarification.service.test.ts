import { beforeEach, describe, expect, it, vi } from "vitest";

import { postTarificationMessage } from "@/app/api/tarifications/tarification.service";
import { AuthorLevel, Visibility } from "@/generated/prisma/enums";

const mockUpsertStructureTarification = vi.fn();

vi.mock("@/app/api/tarifications/tarification.repository", () => ({
  upsertStructureTarification: (...args: unknown[]) =>
    mockUpsertStructureTarification(...args),
  findStructureTarification: vi.fn(),
  findMessageTarification: vi.fn(),
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
  getUserWithGrantsByEmail: vi.fn(),
}));

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return { ...actual, CURRENT_YEAR: 2027 };
});

describe("postTarificationMessage", () => {
  const message = {
    structureId: 1,
    year: 2027,
    visibility: Visibility.SHARED,
    author: { id: 1, level: AuthorLevel.DEPARTEMENT, isSuperAdmin: false },
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
        author: { id: 1, level: AuthorLevel.OPERATEUR, isSuperAdmin: false },
      })
    ).rejects.toThrow("pas accessibles à l'opérateur");

    expect(mockUpsertStructureTarification).not.toHaveBeenCalled();
  });
});
